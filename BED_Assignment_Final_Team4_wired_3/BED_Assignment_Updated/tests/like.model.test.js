/*
Owner: Yongsheng
Unit tests for models/like.model.js  (MODEL layer)
*/

jest.mock("../dbConfig", () => {
  const mockQuery = jest.fn();
  const mockRequest = {
    input: jest.fn(function () {
      return this;
    }),
    query: mockQuery,
  };
  return {
    sql: { Int: "Int" },
    poolPromise: Promise.resolve({ request: () => mockRequest }),
    __mockRequest: mockRequest,
    __mockQuery: mockQuery,
  };
});

const { __mockRequest, __mockQuery } = require("../dbConfig");
const likeModel = require("../models/like.model");

describe("like.model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("itemExists", () => {
    it("checks MenuItems, not ItemLikes", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ ItemID: 10 }] });

      const result = await likeModel.itemExists(10);

      expect(result).toBe(true);
      expect(__mockQuery.mock.calls[0][0]).toContain("FROM MenuItems");
    });

    it("returns false when the item does not exist", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await likeModel.itemExists(999)).toBe(false);
    });
  });

  describe("find", () => {
    it("binds both patronId and itemId", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ LikeID: 42 }] });

      const result = await likeModel.find(6, 10);

      expect(result).toEqual({ LikeID: 42 });
      expect(__mockRequest.input).toHaveBeenCalledWith("patronId", "Int", 6);
      expect(__mockRequest.input).toHaveBeenCalledWith("itemId", "Int", 10);
    });

    it("returns null when no like exists yet", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await likeModel.find(6, 10)).toBeNull();
    });
  });

  describe("create", () => {
    it("inserts a new like row", async () => {
      __mockQuery.mockResolvedValue({});

      await likeModel.create(6, 10);

      expect(__mockQuery.mock.calls[0][0]).toContain("INSERT INTO ItemLikes");
    });
  });

  describe("remove", () => {
    it("deletes by LikeID", async () => {
      __mockQuery.mockResolvedValue({});

      await likeModel.remove(42);

      expect(__mockRequest.input).toHaveBeenCalledWith("id", "Int", 42);
      expect(__mockQuery.mock.calls[0][0]).toContain("DELETE FROM ItemLikes WHERE LikeID = @id");
    });
  });

  describe("countByItemId", () => {
    it("returns the LikeCount value from the aggregate row", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ LikeCount: 7 }] });

      expect(await likeModel.countByItemId(10)).toBe(7);
    });
  });
});
