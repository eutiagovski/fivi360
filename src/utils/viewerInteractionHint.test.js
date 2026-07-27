import {
  VIEWER_HINT_SESSION_KEY,
  hasSeenViewerHint,
  markViewerHintSeen,
} from "@/utils/viewerInteractionHint";

describe("viewerInteractionHint", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("não marca como visto antes de dismiss", () => {
    expect(hasSeenViewerHint()).toBe(false);
  });

  it("persiste a dica como vista na sessão", () => {
    markViewerHintSeen();
    expect(sessionStorage.getItem(VIEWER_HINT_SESSION_KEY)).toBe("1");
    expect(hasSeenViewerHint()).toBe(true);
  });
});
