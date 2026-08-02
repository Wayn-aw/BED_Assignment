/*
Owner: Yongsheng
Unit tests for models/analytics.model.js  (MODEL layer)
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
const analyticsModel = require("../models/analytics.model");

describe("analytics.model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getRevenueSummary", () => {
    it("excludes Cancelled orders from the revenue total", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ TotalRevenue: 500, TotalOrders: 20 }] });

      const result = await analyticsModel.getRevenueSummary(1);

      expect(result).toEqual({ TotalRevenue: 500, TotalOrders: 20 });
      expect(__mockQuery.mock.calls[0][0]).toContain("OrderStatus <> 'Cancelled'");
    });
  });

  describe("getPopularItems", () => {
    it("limits to the top 5 items ranked by quantity sold", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ ItemName: "Chicken Rice", TotalSold: 50 }] });

      const result = await analyticsModel.getPopularItems(1);

      expect(result).toEqual([{ ItemName: "Chicken Rice", TotalSold: 50 }]);
      const sqlSent = __mockQuery.mock.calls[0][0];
      expect(sqlSent).toContain("TOP 5");
      expect(sqlSent).toContain("ORDER BY TotalSold DESC");
    });
  });

  describe("getPeakHours", () => {
    it("groups by hour of day using DATEPART", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ HourOfDay: 12, OrderCount: 15 }] });

      const result = await analyticsModel.getPeakHours(1);

      expect(result).toEqual([{ HourOfDay: 12, OrderCount: 15 }]);
      expect(__mockQuery.mock.calls[0][0]).toContain("DATEPART(HOUR, OrderDate)");
    });
  });
});
