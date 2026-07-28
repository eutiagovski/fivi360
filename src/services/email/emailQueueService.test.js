jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(() => ({ path: "emailQueue" })),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
}));

jest.mock("../../config/firebase", () => ({
  auth: { currentUser: null },
  db: { name: "mock-db" },
}));

const { addDoc, collection } = require("firebase/firestore");
const { auth } = require("../../config/firebase");
const {
  enqueueVerifyEmail,
  CLIENT_EMAIL_TYPES,
} = require("./emailQueueService");

describe("enqueueVerifyEmail — RC-BUG-001", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.currentUser = null;
    addDoc.mockResolvedValue({ id: "queue-1" });
    collection.mockReturnValue({ path: "emailQueue" });
  });

  it("uses auth.currentUser.email (canonical), not form to", async () => {
    auth.currentUser = {
      uid: "uid-1",
      email: "usuario@email.com",
    };

    const id = await enqueueVerifyEmail({
      to: "Usuario@Email.com",
      userId: "uid-1",
      name: "Ana",
    });

    expect(id).toBe("queue-1");
    expect(addDoc).toHaveBeenCalledWith(
      { path: "emailQueue" },
      expect.objectContaining({
        type: CLIENT_EMAIL_TYPES.VERIFY_EMAIL,
        to: "usuario@email.com",
        userId: "uid-1",
        status: "pending",
        payload: { name: "Ana" },
      }),
    );
  });

  it("throws when there is no authenticated email", async () => {
    await expect(
      enqueueVerifyEmail({
        to: "anyone@example.com",
        userId: "uid-1",
      }),
    ).rejects.toMatchObject({
      code: "verification-email-missing-auth-email",
    });

    expect(addDoc).not.toHaveBeenCalled();
  });
});
