/*
Owner: Jeremiah
Unit tests for models/promotion.model.js  (MODEL layer)
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
    sql: { VarChar: "VarChar", Int: "Int", DateTime: "DateTime" },
    poolPromise: Promise.resolve({ request: () => mockRequest }),
    __mockRequest: mockRequest,
    __mockQuery: mockQuery,
  };
});

const { __mockRequest, __mockQuery } = require("../dbConfig");
const promotionModel = require("../models/promotion.model");

describe("promotion.model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("binds all five columns and returns the inserted row", async () => {
      const inserted = { PromoID: 1, Title: "10% Off" };
      __mockQuery.mockResolvedValue({ recordset: [inserted] });

      const result = await promotionModel.create({
        stallId: 1, title: "10% Off", discountPercentage: 10, startDate: "2026-01-01", endDate: "2026-01-31",
      });

      expect(result).toEqual(inserted);
      expect(__mockRequest.input).toHaveBeenCalledWith("pct", "Int", 10);
      expect(__mockRequest.input).toHaveBeenCalledTimes(5);
    });
  });

  describe("findByStallId", () => {
    it("computes an Active/Upcoming/Ended status via a CASE expression", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ PromoID: 1, Status: "Active" }] });

      const result = await promotionModel.findByStallId(1);

      expect(result).toEqual([{ PromoID: 1, Status: "Active" }]);
      const sqlSent = __mockQuery.mock.calls[0][0];
      expect(sqlSent).toContain("CASE WHEN GETDATE() BETWEEN StartDate AND EndDate THEN 'Active'");
      expect(sqlSent).toContain("ORDER BY StartDate DESC");
    });
  });

  describe("findById", () => {
    it("returns null when the promotion does not exist", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await promotionModel.findById(999)).toBeNull();
    });
  });

  describe("update", () => {
    it("updates all four editable columns", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ PromoID: 1 }] });

      await promotionModel.update(1, { title: "New", discountPercentage: 20, startDate: "2026-02-01", endDate: "2026-02-28" });

      const sqlSent = __mockQuery.mock.calls[0][0];
      expect(sqlSent).toContain("SET Title = @title, DiscountPercentage = @pct, StartDate = @start, EndDate = @end");
    });

    it("returns null when the promotion does not exist", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await promotionModel.update(999, {})).toBeNull();
    });
  });

  describe("remove", () => {
    it("deletes by PromoID", async () => {
      __mockQuery.mockResolvedValue({});

      await promotionModel.remove(1);

      expect(__mockQuery.mock.calls[0][0]).toContain("DELETE FROM Promotions WHERE PromoID = @id");
    });
  });
});
