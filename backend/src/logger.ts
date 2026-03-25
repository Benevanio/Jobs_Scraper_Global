export function logInfo(message) {
  console.log(`[INFO] ${new Date().toISOString()} ${message}`);
}

export function logWarn(message) {
  console.warn(`[WARN] ${new Date().toISOString()} ${message}`);
}

export function logError(message) {
  console.error(`[ERROR] ${new Date().toISOString()} ${message}`);
}
