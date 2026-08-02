/*
Owner: Yongsheng
Unit tests for controllers/analytics.controller.js
*/

jest.mock("../models/analytics.model");

const analyticsModel = require("../models/analytics.model");
const analyticsController = require("../controllers/analytics.controller");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("analytics.controller", () => {
  let res, next;

  beforeEach(() => {
    res = mockRes();
    next = jest.fn();
  });

  describe("getSalesAnalytics", () => {
    it("composes three model calls into one response payload", async () => {
      analyticsModel.getRevenueSummary.mockResolvedValue({ TotalRevenue: 500, TotalOrders: 20 });
      analyticsModel.getPopularItems.mockResolvedValue([{ ItemName: "Chicken Rice", TotalSold: 50 }]);
      analyticsModel.getPeakHours.mockResolvedValue([{ HourOfDay: 12, OrderCount: 15 }]);

      await analyticsController.getSalesAnalytics({ params: { stallId: "1" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalRevenue: 500,
          totalOrders: 20,
          popularItems: [{ ItemName: "Chicken Rice", TotalSold: 50 }],
          peakHours: [{ HourOfDay: 12, OrderCount: 15 }],
        },
      });
    });

    it("defaults totalRevenue and totalOrders to 0 for a stall with no orders yet, rather than null", async () => {
      analyticsModel.getRevenueSummary.mockResolvedValue({ TotalRevenue: null, TotalOrders: null });
      analyticsModel.getPopularItems.mockResolvedValue([]);
      analyticsModel.getPeakHours.mockResolvedValue([]);

      await analyticsController.getSalesAnalytics({ params: { stallId: "1" } }, res, next);

      const payload = res.json.mock.calls[0][0];
      expect(payload.data.totalRevenue).toBe(0);
      expect(payload.data.totalOrders).toBe(0);
    });

    it("forwards model errors to next()", async () => {
      const boom = new Error("db down");
      analyticsModel.getRevenueSummary.mockRejectedValue(boom);

      await analyticsController.getSalesAnalytics({ params: { stallId: "1" } }, res, next);

      expect(next).toHaveBeenCalledWith(boom);
    });
  });
});
