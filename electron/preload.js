'use strict';

/**
 * Preload script — runs in a sandboxed context before the renderer page loads.
 *
 * Use `contextBridge.exposeInMainWorld` here if you ever need to expose
 * safe IPC helpers to the React app. For now the app only needs the backend
 * HTTP API, so no extra bridging is required.
 */
