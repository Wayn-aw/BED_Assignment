/*
Owner: Kyra
Unit tests for controllers/feedback.controller.js
*/

jest.mock("../dbConfig", () => ({
  sql: { VarChar: "VarChar", Int: "Int" },
  poolPromise: Promise.resolve({}),
}));
jest.mock("../models/feedback.model");
jest.mock("../models/stall.model");

const feedbackModel = require("../models/feedback.model");
const stallModel = require("../models/stall.model");
const feedbackController = require("../controllers/feedback.controller");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("feedback.controller", () => {
  let res, next;
  const patron = { userId: 6, role: "Patron" };

  beforeEach(() => {
    res = mockRes();
    next = jest.fn();
  });

  describe("createFeedback", () => {
    it("returns 201 for a valid rating", async () => {
      stallModel.exists.mockResolvedValue(true);
      feedbackModel.create.mockResolvedValue({ FeedbackID: 1, Rating: 5 });

      await feedbackController.createFeedback(
        { body: { stallId: 1, rating: 5, comments: "Great!" }, user: patron },
        res,
        next
      );

      expect(feedbackModel.create).toHaveBeenCalledWith({ patronId: 6, stallId: 1, rating: 5, comments: "Great!" });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("returns 400 when stallId or rating is missing", async () => {
      await feedbackController.createFeedback({ body: { stallId: 1 }, user: patron }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(stallModel.exists).not.toHaveBeenCalled();
    });

    it.each([0, 6, -1])("returns 400 for an out-of-range rating of %i", async (rating) => {
      await feedbackController.createFeedback({ body: { stallId: 1, rating }, user: patron }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 404 when the stall does not exist", async () => {
      stallModel.exists.mockResolvedValue(false);

      await feedbackController.createFeedback({ body: { stallId: 999, rating: 4 }, user: patron }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(feedbackModel.create).not.toHaveBeenCalled();
    });
  });

  describe("getFeedbackForStall", () => {
    it("returns feedback for the stall", async () => {
      feedbackModel.findByStallId.mockResolvedValue([{ FeedbackID: 1, Rating: 5 }]);

      await feedbackController.getFeedbackForStall({ params: { id: "1" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, count: 1, data: [{ FeedbackID: 1, Rating: 5 }] });
    });
  });

  describe("updateFeedback", () => {
    const existing = { FeedbackID: 1, PatronID: 6, Rating: 4, Comments: "Good" };

    it("allows the owning patron to edit their feedback", async () => {
      feedbackModel.findById.mockResolvedValue(existing);
      feedbackModel.update.mockResolvedValue({ ...existing, Rating: 5 });

      await feedbackController.updateFeedback({ params: { id: "1" }, body: { rating: 5 }, user: patron }, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 403 when a different patron tries to edit someone else's feedback", async () => {
      feedbackModel.findById.mockResolvedValue(existing);

      await feedbackController.updateFeedback(
        { params: { id: "1" }, body: { rating: 5 }, user: { userId: 99, role: "Patron" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(feedbackModel.update).not.toHaveBeenCalled();
    });

    it("returns 404 when the feedback does not exist", async () => {
      feedbackModel.findById.mockResolvedValue(null);

      await feedbackController.updateFeedback({ params: { id: "999" }, body: {}, user: patron }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 400 for an out-of-range rating", async () => {
      await feedbackController.updateFeedback(
        { params: { id: "1" }, body: { rating: 8 }, user: patron },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(feedbackModel.findById).not.toHaveBeenCalled();
    });
  });

  describe("deleteFeedback", () => {
    const existing = { FeedbackID: 1, PatronID: 6 };

    it("allows the owning patron to delete their own feedback", async () => {
      feedbackModel.findById.mockResolvedValue(existing);

      await feedbackController.deleteFeedback({ params: { id: "1" }, user: patron }, res, next);

      expect(feedbackModel.remove).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("allows Admin to delete anyone's feedback", async () => {
      feedbackModel.findById.mockResolvedValue(existing);

      await feedbackController.deleteFeedback(
        { params: { id: "1" }, user: { userId: 99, role: "Admin" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 403 for a different patron who does not own the feedback and is not Admin", async () => {
      feedbackModel.findById.mockResolvedValue(existing);

      await feedbackController.deleteFeedback(
        { params: { id: "1" }, user: { userId: 99, role: "Patron" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(feedbackModel.remove).not.toHaveBeenCalled();
    });

    it("returns 404 when the feedback does not exist", async () => {
      feedbackModel.findById.mockResolvedValue(null);

      await feedbackController.deleteFeedback({ params: { id: "999" }, user: patron }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
