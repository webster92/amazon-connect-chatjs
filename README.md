# amazon-connect-chatjs (fork)

This is a fork of the official [amazon-connect/amazon-connect-chatjs](https://github.com/amazon-connect/amazon-connect-chatjs) library, maintained for use in the Amazon Connect Chat PoC monorepo ([`<monorepo-repo-url>`](<monorepo-repo-url>)). The fork adds a `ParticipantServiceClient` interface that allows all Amazon Connect Participant Service API calls to be routed through a custom service layer instead of the bundled AWS SDK client, enabling proxy-based and server-side chat integrations. This package is consumed as a local `file:` dependency and is **not published to npm**.

---

## Prerequisites

- **Node.js** `>=14.0.0` (see `engines` in [package.json](package.json))
- **npm** (any version bundled with the above Node.js range)
- No global tools are required beyond `node` and `npm`

---

## Installation

```bash
npm install
```

---

## Building

### Production build

The production build type-checks, lints, runs tests, then produces all output artifacts:

```bash
npm run release
```

This runs `tsc && npm run lint && jest && webpack --mode=production && node build-chatclient.mjs` and writes all output to `dist/`.

### Development build (one-shot)

Skips linting/type-check and builds in development mode (includes source maps, unminified):

```bash
npm run devo
```

### Development build + watch

Builds once in development mode, then re-builds on every file change:

```bash
npm run dev
```

### Watch only

If you have already built once and only want incremental rebuilds:

```bash
npm run watch
```

---

## Output

`npm run release` populates `dist/` with:

| File | Description |
|---|---|
| `dist/amazon-connect-chat.js` | Main UMD bundle (webpack, production-minified). This is the `main` entry point. |
| `dist/amazon-connect-chat.js.map` | Source map for the main bundle. |
| `dist/chatclient.esm.js` | ESM bundle of the low-level client, built with esbuild. Resolved by the `./chatclient` export path. |
| `dist/chatclient.d.ts` | TypeScript declarations (copied from `src/chatclient.d.ts`). Referenced by both export conditions. |
| `dist/index.d.ts` | Additional top-level TypeScript declarations (copied from `src/index.d.ts`). |

The consuming monorepo imports the package via the default `"."` export condition, which resolves to **`dist/amazon-connect-chat.js`**. The `dist/chatclient.esm.js` file is only needed if the monorepo explicitly imports `amazon-connect-chatjs/chatclient`.

---

## Consuming this package from the monorepo

The monorepo's `package.json` references this repo via a local file path:

```json
{
  "dependencies": {
    "amazon-connect-chatjs": "file:../amazon-connect-chatjs"
  }
}
```

**The build must be run in this repo before running `npm install` in the monorepo.** npm resolves `file:` dependencies by copying the package at install time; if `dist/` does not exist, the monorepo will install a broken package.

Required directory layout:

```
parent-directory/
├── amazon-connect-chatjs/              ← this repo (built)
└── amazon-connect-chat-poc-monorepo/   ← the monorepo
```

Typical workflow after cloning both repos:

```bash
# 1. Build this package
cd amazon-connect-chatjs
npm install
npm run release

# 2. Install the monorepo (picks up the built file: dependency)
cd ../amazon-connect-chat-poc-monorepo
npm install
```

If you change source files in this repo, re-run `npm run release` (or `npm run devo` for a faster dev build), then re-run `npm install` in the monorepo to pick up the updated bundle.

---

## Syncing with upstream

No upstream remote is currently configured. Add one before merging:

```bash
git remote add upstream https://github.com/amazon-connect/amazon-connect-chatjs.git
git fetch upstream
```

Then merge upstream changes into your working branch:

```bash
git merge upstream/master
```

Or rebase if you prefer a linear history:

```bash
git rebase upstream/master
```

**Watch out for conflicts in these fork-specific files**, which differ from upstream and should not be overwritten:

- `src/client/client.js` — custom `ParticipantServiceClient` wiring
- `src/index.d.ts` — extended TypeScript declarations for `customClient`, `sendMessageReceipt`, and related interfaces
- `src/chatclient.d.ts` — declarations for the ESM client export
- `build-chatclient.mjs` — esbuild script for the ESM bundle (not present in upstream)
- `webpack.config.js` — includes `CopyWebpackPlugin` for declaration files

After resolving conflicts, rebuild and re-test:

```bash
npm run release
```
