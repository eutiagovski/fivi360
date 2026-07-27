export const VIEWER_HINT_SESSION_KEY = "fivi360_viewer_hint_seen";
export const VIEWER_HINT_DISMISS_MS = 2000;
export const VIEWER_HINT_MOVEMENT_THRESHOLD = 0.3;

export function hasSeenViewerHint() {
  try {
    return sessionStorage.getItem(VIEWER_HINT_SESSION_KEY) === "1";
  } catch {
    return true;
  }
}

export function markViewerHintSeen() {
  try {
    sessionStorage.setItem(VIEWER_HINT_SESSION_KEY, "1");
  } catch {
    // sessionStorage indisponível (ex.: modo privado restrito)
  }
}
