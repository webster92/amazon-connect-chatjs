import {
    UnImplementedMethodException,
    IllegalArgumentException
} from "./exceptions";
import { ChatClientFactory } from "../client/client";
import { ChatServiceArgsValidator } from "./chatArgsValidator";
import { SESSION_TYPES, CHAT_EVENTS, FEATURES, CHAT_SESSION_ERROR_TYPES, CHAT_SESSION_SUCCESS_TYPES } from "../constants";
import { GlobalConfig } from "../globalConfig";
import { ChatController } from "./chatController";
import { LogManager, LogLevel, Logger } from "../log";
import WebSocketManager from "../lib/amazon-connect-websocket-manager";

const logger = LogManager.getLogger({ prefix: "ChatJS-GlobalConfig" });

class ChatSessionFactory {
    /*eslint-disable no-unused-vars*/

    createAgentChatController(chatDetails, participantType) {
        throw new UnImplementedMethodException(
            "createAgentChatController in ChatControllerFactory."
        );
    }

    createCustomerChatController(chatDetails, participantType) {
        throw new UnImplementedMethodException(
            "createCustomerChatController in ChatControllerFactory."
        );
    }
    /*eslint-enable no-unused-vars*/
}

class PersistentConnectionAndChatServiceSessionFactory extends ChatSessionFactory {
    constructor() {
        super();
        this.argsValidator = new ChatServiceArgsValidator();
    }

    createChatSession(sessionType, chatDetails, options, websocketManager) {
        const chatController = this._createChatController(sessionType, chatDetails, options, websocketManager);
        return new CustomerChatSession(chatController);
    }

    _createChatController(sessionType, chatDetailsInput, options, websocketManager) {
        try {
            var chatDetails = this.argsValidator.normalizeChatDetails(chatDetailsInput);
            var logMetaData = {
                contactId: chatDetails.contactId,
                participantId: chatDetails.participantId,
                sessionType,
            };

            var chatClient = ChatClientFactory.getCachedClient(options, logMetaData);

            var args = {
                sessionType: sessionType,
                chatDetails,
                chatClient,
                websocketManager: websocketManager,
                logMetaData,
            };

            return new ChatController(args);
        }
        catch (err){
            logger.error("Error while creating chat session", err);
        }
    }
}

export class ChatSession {
    constructor(controller) {
        this.controller = controller;
    }

    onMessage(callback) {
        this.controller.subscribe(CHAT_EVENTS.INCOMING_MESSAGE, callback);
    }

    onTyping(callback) {
        this.controller.subscribe(CHAT_EVENTS.INCOMING_TYPING, callback);
    }

    onReadReceipt(callback) {
        this.controller.subscribe(CHAT_EVENTS.INCOMING_READ_RECEIPT, callback);
    }

    onDeliveredReceipt(callback) {
        this.controller.subscribe(CHAT_EVENTS.INCOMING_DELIVERED_RECEIPT, callback);
    }

    onConnectionBroken(callback) {
        this.controller.subscribe(CHAT_EVENTS.CONNECTION_BROKEN, callback);
    }

    onConnectionEstablished(callback) {
        this.controller.subscribe(CHAT_EVENTS.CONNECTION_ESTABLISHED, callback);
    }

    onEnded(callback) {
        this.controller.subscribe(CHAT_EVENTS.CHAT_ENDED, callback);
    }

    onParticipantIdle(callback) {
        this.controller.subscribe(CHAT_EVENTS.PARTICIPANT_IDLE, callback);
    }

    onParticipantReturned(callback) {
        this.controller.subscribe(CHAT_EVENTS.PARTICIPANT_RETURNED, callback);
    }

    onParticipantInvited(callback) {
        this.controller.subscribe(CHAT_EVENTS.PARTICIPANT_INVITED, callback);
    }

    onAutoDisconnection(callback) {
        this.controller.subscribe(CHAT_EVENTS.AUTODISCONNECTION, callback);
    }

    onConnectionLost(callback) {
        this.controller.subscribe(CHAT_EVENTS.CONNECTION_LOST, callback);
    }

    onDeepHeartbeatSuccess(callback){
        this.controller.subscribe(CHAT_EVENTS.DEEP_HEARTBEAT_SUCCESS, callback);
    }

    onDeepHeartbeatFailure(callback){
        this.controller.subscribe(CHAT_EVENTS.DEEP_HEARTBEAT_FAILURE, callback);
    }

    onParticipantDisplayNameUpdated(callback) {
        this.controller.subscribe(CHAT_EVENTS.PARTICIPANT_DISPLAY_NAME_UPDATED, callback);
    }

    onChatRehydrated(callback) {
        this.controller.subscribe(CHAT_EVENTS.CHAT_REHYDRATED, callback);
    }

    onTranscriptUpdated(callback) {
        this.controller.subscribe(CHAT_EVENTS.TRANSCRIPT_UPDATED, callback);
    }

    sendMessage(args) {
        return this.controller.sendMessage(args);
    }

    sendAttachment(args){
        return this.controller.sendAttachment(args);
    }

    connect(args) {
        return this.controller.connect(args);
    }

    sendEvent(args) {
        return this.controller.sendEvent(args);
    }

    sendMessageReceipt(args) {
        return this.controller.sendMessageReceipt(args);
    }

    getTranscript(args) {
        return this.controller.getTranscript(args);
    }

    getChatDetails() {
        return this.controller.getChatDetails();
    }
}
class CustomerChatSession extends ChatSession {
    constructor(controller) {
        super(controller);
    }

    disconnectParticipant() {
        return this.controller.disconnectParticipant();
    }
}

export const CHAT_SESSION_FACTORY = new PersistentConnectionAndChatServiceSessionFactory();

var setGlobalConfig = config => {
    var loggerConfig = config.loggerConfig;
    GlobalConfig.update(config);
    /**
   * if config.loggerConfig.logger is present - use it in websocketManager
   * if config.loggerConfig.customizedLogger is present - use it in websocketManager
   * if config.loggerConfig.useDefaultLogger is true - use default window.console + default level INFO
   * config.loggerConfig.advancedLogWriter to customize where you want to log advancedLog messages. Default is warn.
   * else no logs from websocketManager - DEFAULT
   *
   * if config.webSocketManagerConfig.isNetworkOnline is present - use it in websocketManager
   * else websocketManager uses "navigator.onLine" - DEFAULT
   */
    WebSocketManager.setGlobalConfig(config);
    LogManager.updateLoggerConfig(loggerConfig);
    /**
     * Handle setting message receipts feature in Global Config. If no values are given will default to:
     *   - Message receipts enabled
     *   - Throttle = 5000 ms
     *
     * The receipts feature flag and throttle are re-evaluated only when `config.features`
     * is present. When omitted, the previously configured values are preserved so a
     * subsequent setGlobalConfig call that updates unrelated fields does not unintentionally
     * reset them.
     */
    if (config.features !== undefined) {
        logger.warn("enabling message-receipts by default; to disable set config.features.messageReceipts.shouldSendMessageReceipts = false");
        GlobalConfig.updateThrottleTime(config.features?.messageReceipts?.throttleTime);
        if (config.features?.messageReceipts?.shouldSendMessageReceipts === false) {
            GlobalConfig.removeFeatureFlag(FEATURES.MESSAGE_RECEIPTS_ENABLED);
        } else {
            /**
             * Note: if update config is called with `config.features` array, it replaces default config
             * this ensure `message-receipts` feature is always enabled.
             * Only way to disable message receipts is by setting config.features.messageReceipts.shouldSendMessageReceipts == false
             * */
            setFeatureFlag(FEATURES.MESSAGE_RECEIPTS_ENABLED);
        }
    }
    // else: features omitted, preserve the prior caller's message-receipts configuration
};

var setFeatureFlag = feature => {
    GlobalConfig.setFeatureFlag(feature);
};

var ChatSessionConstructor = args => {
    var options = args.options || {};
    var type = args.type || SESSION_TYPES.AGENT;
    GlobalConfig.updateStageRegionCell(options);
    // initialize CSM Service for only customer chat widget
    // Disable CSM service from canary test
    
    return CHAT_SESSION_FACTORY.createChatSession(
        args.chatDetails,
        options,//options contain region 
        args.websocketManager,
    );
};

var setRegionOverride = regionOverride => {
    GlobalConfig.updateRegionOverride(regionOverride);
};

const ChatSessionObject = {
    create: ChatSessionConstructor,
    setGlobalConfig: setGlobalConfig,
    LogLevel: LogLevel,
    Logger: Logger,
    SessionTypes: SESSION_TYPES,
    setFeatureFlag: setFeatureFlag,
    setRegionOverride: setRegionOverride
};

export { ChatSessionObject };
