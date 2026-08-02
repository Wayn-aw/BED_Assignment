/*
Owner: Kyra
Unit tests for models/feedback.model.js  (MODEL layer)
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
    sql: { VarChar: "VarChar", Int: "Int" },
    poolPromise: Promise.resolve({ request: () => mockRequest }),
    __mockRequest: mockRequest,
    __mockQuery: mockQuery,
  };
});

const { __mockRequest, __mockQuery } = require("../dbConfig");
const feedbackModel = require("../models/feedback.model");

describe("feedback.model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("binds all four columns and returns the inserted row", async () => {
      const inserted = { FeedbackID: 1, Rating: 5 };
      __mockQuery.mockResolvedValue({ recordset: [inserted] });

      const result = await feedbackModel.create({ patronId: 6, stallId: 1, rating: 5, comments: "Great!" });

      expect(result).toEqual(inserted);
      expect(__mockRequest.input).toHaveBeenCalledWith("patronId", "Int", 6);
      expect(__mockRequest.input).toHaveBeenCalledWith("rating", "Int", 5);
      expect(__mockRequest.input).toHaveBeenCalledWith("comments", "VarChar", "Great!");
    });

    it("coerces missing comments to null rather than binding undefined", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ FeedbackID: 1 }] });

      await feedbackModel.create({ patronId: 6, stallId: 1, rating: 5, comments: undefined });

      expect(__mockRequest.input).toHaveBeenCalledWith("comments", "VarChar", null);
    });
  });

  describe("findByStallId", () => {
    it("joins Users for the reviewer's name and orders by newest first", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ FeedbackID: 1, PatronName: "Jonathan" }] });

      const result = await feedbackModel.findByStallId(1);

      expect(result).toEqual([{ FeedbackID: 1, PatronName: "Jonathan" }]);
      const sqlSent = __mockQuery.mock.calls[0][0];
      expect(sqlSent).toContain("JOIN Users u ON u.UserID = f.PatronID");
      expect(sqlSent).toContain("ORDER BY f.CreatedAt DESC");
    });
  });

  describe("findById", () => {
    it("returns null when the feedback does not exist", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await feedbackModel.findById(999)).toBeNull();
    });
  });

  describe("update", () => {
    it("updates Rating and Comments only", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ FeedbackID: 1, Rating: 4 }] });

      await feedbackModel.update(1, { rating: 4, comments: "Updated" });

      expect(__mockQuery.mock.calls[0][0]).toContain("SET Rating = @rating, Comments = @comments");
    });
  });

  describe("remove", () => {
    it("deletes by FeedbackID", async () => {
      __mockQuery.mockResolvedValue({});

      await feedbackModel.remove(1);

      expect(__mockQuery.mock.calls[0][0]).toContain("DELETE FROM Feedback WHERE FeedbackID = @id");
    });
  });
});
