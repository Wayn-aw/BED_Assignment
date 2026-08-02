/*
Owner: Yongsheng
Unit tests for controllers/likes.controller.js
*/

jest.mock("../dbConfig", () => ({
  sql: { Int: "Int" },
  poolPromise: Promise.resolve({}),
}));
jest.mock("../models/like.model");

const likeModel = require("../models/like.model");
const likesController = require("../controllers/likes.controller");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("likes.controller", () => {
  let res, next;
  const patron = { userId: 6, role: "Patron" };

  beforeEach(() => {
    res = mockRes();
    next = jest.fn();
  });

  describe("toggleLike", () => {
    it("likes the item when no existing like is found", async () => {
      likeModel.itemExists.mockResolvedValue(true);
      likeModel.find.mockResolvedValue(null);
      likeModel.countByItemId.mockResolvedValue(5);

      await likesController.toggleLike({ params: { itemId: "10" }, user: patron }, res, next);

      expect(likeModel.create).toHaveBeenCalledWith(6, "10");
      expect(likeModel.remove).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Item liked.",
        data: { itemId: 10, liked: true, likeCount: 5 },
      });
    });

    it("unlikes the item when an existing like is found", async () => {
      likeModel.itemExists.mockResolvedValue(true);
      likeModel.find.mockResolvedValue({ LikeID: 42 });
      likeModel.countByItemId.mockResolvedValue(4);

      await likesController.toggleLike({ params: { itemId: "10" }, user: patron }, res, next);

      expect(likeModel.remove).toHaveBeenCalledWith(42);
      expect(likeModel.create).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Like removed.",
        data: { itemId: 10, liked: false, likeCount: 4 },
      });
    });

    it("returns 404 when the menu item does not exist", async () => {
      likeModel.itemExists.mockResolvedValue(false);

      await likesController.toggleLike({ params: { itemId: "999" }, user: patron }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(likeModel.find).not.toHaveBeenCalled();
    });

    it("forwards model errors to next()", async () => {
      const boom = new Error("db down");
      likeModel.itemExists.mockRejectedValue(boom);

      await likesController.toggleLike({ params: { itemId: "10" }, user: patron }, res, next);

      expect(next).toHaveBeenCalledWith(boom);
    });
  });

  describe("getLikesForItem", () => {
    it("returns the like count for an item", async () => {
      likeModel.countByItemId.mockResolvedValue(7);

      await likesController.getLikesForItem({ params: { itemId: "10" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { itemId: 10, likeCount: 7 } });
    });
  });
});
