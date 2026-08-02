/*
Owner: Jeremiah 
Feature: Vendor Promotions (US14)
 */

const promotionModel = require("../models/promotion.model");
const stallModel = require("../models/stall.model");

//CREATE
exports.createPromotion = async (req, res, next) => {
  try {
    const { stallId, title, discountPercentage, startDate, endDate } = req.body;
    if (!stallId || !title || !discountPercentage || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "stallId, title, discountPercentage, startDate and endDate are required." });
    }
    if (discountPercentage < 1 || discountPercentage > 100) {
      return res.status(400).json({ success: false, message: "discountPercentage must be between 1 and 100." });
    }
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ success: false, message: "endDate must be after startDate." });
    }

    const owns = await stallModel.isOwnedBy(stallId, req.user.userId);
    if (!owns) {
      return res.status(403).json({ success: false, message: "You do not have permission to create promotions for this stall." });
    }

    const promo = await promotionModel.create({ stallId, title, discountPercentage, startDate, endDate });
    res.status(201).json({ success: true, message: "Promotion created.", data: promo });
  } catch (err) {
    next(err);
  }
};

//READ: promotions for a stall
exports.getPromotionsForStall = async (req, res, next) => {
  try {
    const promos = await promotionModel.findByStallId(req.params.id);
    res.status(200).json({ success: true, count: promos.length, data: promos });
  } catch (err) {
    next(err);
  }
};

//DELETE
exports.deletePromotion = async (req, res, next) => {
  try {
    const existing = await promotionModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Promotion not found." });
    }

    const owns = await stallModel.isOwnedBy(existing.StallID, req.user.userId);
    if (!owns) {
      return res.status(403).json({ success: false, message: "You do not have permission to delete this promotion." });
    }

    await promotionModel.remove(req.params.id);
    res.status(200).json({ success: true, message: "Promotion deleted." });
  } catch (err) {
    next(err);
  }
};

//UPDATE
exports.updatePromotion = async (req, res, next) => {
  try {
    const existing = await promotionModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Promotion not found." });
    }

    const owns = await stallModel.isOwnedBy(existing.StallID, req.user.userId);
    if (!owns) {
      return res.status(403).json({ success: false, message: "You do not have permission to edit this promotion." });
    }

    const { title, discountPercentage, startDate, endDate } = req.body;
    const finalPct = discountPercentage ?? existing.DiscountPercentage;
    const finalStart = startDate ?? existing.StartDate;
    const finalEnd = endDate ?? existing.EndDate;

    if (finalPct < 1 || finalPct > 100) {
      return res.status(400).json({ success: false, message: "discountPercentage must be between 1 and 100." });
    }
    if (new Date(finalEnd) <= new Date(finalStart)) {
      return res.status(400).json({ success: false, message: "endDate must be after startDate." });
    }

    const updated = await promotionModel.update(req.params.id, {
      title: title ?? existing.Title,
      discountPercentage: finalPct,
      startDate: finalStart,
      endDate: finalEnd,
    });
    res.status(200).json({ success: true, message: "Promotion updated.", data: updated });
  } catch (err) {
    next(err);
  }
};
