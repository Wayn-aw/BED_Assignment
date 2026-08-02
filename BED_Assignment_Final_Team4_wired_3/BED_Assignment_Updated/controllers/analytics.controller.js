/*
Owner: Yongsheng 
Feature: Operator Sales Analytics (US11)
*/

const analyticsModel = require("../models/analytics.model");

exports.getSalesAnalytics = async (req, res, next) => {
  try {
    const stallId = req.params.stallId;

    const revenue = await analyticsModel.getRevenueSummary(stallId);
    const popularItems = await analyticsModel.getPopularItems(stallId);
    const peakHours = await analyticsModel.getPeakHours(stallId);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: revenue.TotalRevenue || 0,
        totalOrders: revenue.TotalOrders || 0,
        popularItems,
        peakHours,
      },
    });
  } catch (err) {
    next(err);
  }
};
