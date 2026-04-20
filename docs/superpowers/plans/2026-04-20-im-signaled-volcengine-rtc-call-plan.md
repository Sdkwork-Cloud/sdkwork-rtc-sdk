# IM-Signaled Volcengine RTC Call Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a provider-neutral RTC call orchestration layer in `sdkwork-rtc-sdk` that uses `sdkwork-im-sdk` as signaling and the official Volcengine Web SDK as the default media runtime.

**Architecture:** Keep the existing JDBC-style media core intact and add a separate call/signaling layer above it. The new layer standardizes call session lifecycle, signal transport, and participant credential flow while mapping those standards to `sdkwork-im-sdk` and the official Volcengine runtime bridge.

**Tech Stack:** TypeScript, Node.js test runner, `sdkwork-im-sdk`, `@volcengine/rtc`

---

### Task 1: Lock the public behavior with tests

**Files:**
- Create: `sdkwork-rtc-sdk-typescript/test/volcengine-official-web-bridge.test.mjs`
- Create: `sdkwork-rtc-sdk-typescript/test/im-signaled-call-session.test.mjs`
- Modify: `sdkwork-rtc-sdk-typescript/test/public-api-boundary.test.mjs`

- [ ] Step 1: Write failing tests for the official Volcengine bridge
- [ ] Step 2: Run the targeted tests and verify they fail for missing bridge behavior
- [ ] Step 3: Write failing tests for IM-signaled call lifecycle orchestration
- [ ] Step 4: Run the targeted tests and verify they fail for missing call/signaling behavior
- [ ] Step 5: Update public API boundary expectations for the new exports

### Task 2: Implement the official Volcengine runtime bridge

**Files:**
- Modify: `sdkwork-rtc-sdk-typescript/src/types.ts`
- Modify: `sdkwork-rtc-sdk-typescript/src/providers/volcengine.ts`
- Create: `sdkwork-rtc-sdk-typescript/src/providers/volcengine-official-web.ts`

- [ ] Step 1: Add provider-specific config and loader contracts for official Volcengine runtime loading
- [ ] Step 2: Implement lazy official SDK loading and engine lifecycle management
- [ ] Step 3: Map provider-neutral `join`, `leave`, `publish`, `unpublish`, `muteAudio`, and `muteVideo` to official Volcengine Web APIs
- [ ] Step 4: Re-run the Volcengine bridge tests until green

### Task 3: Implement the provider-neutral call/signaling layer

**Files:**
- Create: `sdkwork-rtc-sdk-typescript/src/call-types.ts`
- Create: `sdkwork-rtc-sdk-typescript/src/call-errors.ts`
- Create: `sdkwork-rtc-sdk-typescript/src/call-session.ts`
- Create: `sdkwork-rtc-sdk-typescript/src/im-signaling.ts`
- Modify: `sdkwork-rtc-sdk-typescript/src/index.ts`

- [ ] Step 1: Define provider-neutral call session, signal envelope, and signaling adapter interfaces
- [ ] Step 2: Implement `sdkwork-im-sdk` signaling adapter without leaking IM DTOs into the RTC public standard
- [ ] Step 3: Implement the call session orchestrator for start, accept, reject, signal exchange, connect media, and end
- [ ] Step 4: Re-run the call lifecycle tests until green

### Task 4: Document and verify the integrated standard

**Files:**
- Modify: `sdkwork-rtc-sdk-typescript/README.md`
- Modify: `README.md`

- [ ] Step 1: Document the default `volcengine + sdkwork-im-sdk` flow and required configuration
- [ ] Step 2: Document the new standard call lifecycle and usage examples
- [ ] Step 3: Run `node .\sdkwork-rtc-sdk-typescript\bin\package-task.mjs test`
- [ ] Step 4: Run `node .\bin\verify-sdk.mjs`
- [ ] Step 5: Commit the RTC SDK changes with one focused commit
