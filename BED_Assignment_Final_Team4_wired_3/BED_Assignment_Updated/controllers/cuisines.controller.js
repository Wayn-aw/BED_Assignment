/*
Owner: Wayne
Feature: Cuisines lookup (supports Vendor Menu CRUD - US6)
Read-only. Cuisines are seeded data (Chinese, Halal, Indian, Noodles,
Rice, Vegetarian-Friendly); this just exposes them so a client can
discover valid cuisineIds to pass into POST /menu.
*/

const menuModel = require("../models/menu.model");

exports.getAllCuisines = async (req, res, next) => {
  try {
    const cuisines = await menuModel.listAllCuisines();
    res.status(200).json({ success: true, count: cuisines.length, data: cuisines });
  } catch (err) {
    next(err);
  }
};
