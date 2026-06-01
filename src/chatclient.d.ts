/// <reference path="./index.d.ts" />

/**
 * Base class for custom Participant Service client implementations.
 * Extend this class and override each method to route calls through
 * your own service layer instead of directly to AWS.
 *
 * @example
 * import { ChatClient } from 'amazon-connect-chatjs';
 * class MyChatClient extends ChatClient {
 *   async sendMessage(connectionToken, content, contentType) {
 *     return fetch('/chat/send', { ... });
 *   }
 * }
 */
export declare class ChatClient implements connect.ParticipantServiceClient {
  createParticipantConnection(
    participantToken: string,
    type: string[] | null,
    acknowledgeConnection: boolean | null
  ): Promise<{ data: {
    Websocket: { Url: string; ConnectionExpiry: string };
    ConnectionCredentials: { ConnectionToken: string; Expiry: string };
  } }>;

  sendMessage(
    connectionToken: string,
    content: string,
    contentType: string,
    clientToken?: string
  ): Promise<{ data: connect.SendMessageResult }>;

  getTranscript(
    connectionToken: string,
    args: connect.GetTranscriptArgs
  ): Promise<{ data: connect.GetTranscriptResult }>;

  sendEvent(
    connectionToken: string,
    contentType: string,
    content: string | null,
    clientToken?: string
  ): Promise<{ data: connect.SendEventResult }>;

  sendAttachment(
    connectionToken: string,
    attachment: File,
    metadata?: unknown
  ): Promise<{ data: unknown }>;

  downloadAttachment(
    connectionToken: string,
    attachmentId: string
  ): Promise<Blob>;

  getAttachmentURL(
    connectionToken: string,
    attachmentId: string
  ): Promise<string>;

  disconnectParticipant(
    connectionToken: string
  ): Promise<{ data: unknown }>;

  getAuthenticationUrl(
    connectionToken: string,
    redirectUri: string,
    sessionId: string
  ): Promise<{ data: connect.GetAuthenticationUrlResult }>;

  cancelParticipantAuthentication(
    connectionToken: string,
    sessionId: string
  ): Promise<{ data: unknown }>;

  describeView(
    viewToken: string,
    connectionToken: string
  ): Promise<{ data: connect.DescribeViewResult }>;
}
