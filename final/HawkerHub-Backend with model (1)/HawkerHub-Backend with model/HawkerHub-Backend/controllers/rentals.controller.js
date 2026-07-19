/**
 * controllers/rentals.controller.js
 * Owner: Yongsheng | Feature: Vendor Rental Tracking (US7)
 */

const rentalModel = require("../models/rental.model");
const stallModel = require("../models/stall.model");

// ---- CREATE ----
exports.createAgreement = async (req, res, next) => {
  try {
    const { stallId, startDate, endDate, monthlyRent } = req.body;
    if (!stallId || !startDate || !endDate || monthlyRent === undefined) {
      return res.status(400).json({ success: false, message: "stallId, startDate, endDate and monthlyRent are required." });
    }
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ success: false, message: "endDate cannot be before startDate." });
    }
    if (monthlyRent < 0) {
      return res.status(400).json({ success: false, message: "monthlyRent must be a non-negative number." });
    }

    const stallExists = await stallModel.exists(stallId);
    if (!stallExists) {
      return res.status(404).json({ success: false, message: "Stall not found." });
    }

    const agreement = await rentalModel.create({ stallId, startDate, endDate, monthlyRent });
    res.status(201).json({ success: true, message: "Rental agreement created.", data: agreement });
  } catch (err) {
    next(err);
  }
};

// ---- READ: full rental history for a stall ----
exports.getAgreementsForStall = async (req, res, next) => {
  try {
    const agreements = await rentalModel.findByStallId(req.params.id);
    res.status(200).json({ success: true, count: agreements.length, data: agreements });
  } catch (err) {
    next(err);
  }
};

// ---- UPDATE ----
exports.updateAgreement = async (req, res, next) => {
  try {
    const { endDate, monthlyRent, status } = req.body;
    const validStatuses = ["Active", "Expired", "Terminated"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(", ")}` });
    }

    const existing = await rentalModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Rental agreement not found." });
    }

    const updated = await rentalModel.update(req.params.id, {
      endDate: endDate ?? existing.EndDate,
      monthlyRent: monthlyRent ?? existing.MonthlyRent,
      status: status ?? existing.Status,
    });
    res.status(200).json({ success: true, message: "Rental agreement updated.", data: updated });
  } catch (err) {
    next(err);
  }
};

// ---- DELETE ----
exports.deleteAgreement = async (req, res, next) => {
  try {
    const existing = await rentalModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Rental agreement not found." });
    }

    await rentalModel.remove(req.params.id);
    res.status(200).json({ success: true, message: "Rental agreement deleted." });
  } catch (err) {
    next(err);
  }
};
