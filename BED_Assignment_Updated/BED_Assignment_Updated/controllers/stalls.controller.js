/*
Owner: Kyra 
Feature: Browse Food Stalls & Menu (US1)
 */

const stallModel = require("../models/stall.model");

//READ: list all stalls (for the homepage catalog)
exports.getAllStalls = async (req, res, next) => {
  try {
    const stalls = await stallModel.findAll();
    res.status(200).json({ success: true, count: stalls.length, data: stalls });
  } catch (err) {
    next(err);
  }
};

//READ: single stall + full menu
exports.getStallById = async (req, res, next) => {
  try {
    const stall = await stallModel.findById(req.params.id);
    if (!stall) {
      return res.status(404).json({ success: false, message: "Stall not found." });
    }
    const menu = await stallModel.findMenuByStallId(req.params.id);
    res.status(200).json({ success: true, data: { ...stall, menu } });
  } catch (err) {
    next(err);
  }
};
