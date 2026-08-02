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

//CREATE: admit a new stall into a hawker centre (Operator/Admin only)
exports.createStall = async (req, res, next) => {
  try {
    const { centreId, ownerId, stallName, description, imageUrl } = req.body;
    if (!centreId || !ownerId || !stallName) {
      return res.status(400).json({ success: false, message: "centreId, ownerId and stallName are required." });
    }

    const centreOk = await stallModel.centreExists(centreId);
    if (!centreOk) {
      return res.status(404).json({ success: false, message: "Hawker centre not found." });
    }
    const ownerOk = await stallModel.isVendor(ownerId);
    if (!ownerOk) {
      return res.status(400).json({ success: false, message: "ownerId must belong to a user with the Vendor role." });
    }

    const stall = await stallModel.create({ centreId, ownerId, stallName, description, imageUrl });
    res.status(201).json({ success: true, message: "Stall created.", data: stall });
  } catch (err) {
    next(err);
  }
};

//UPDATE: edit a stall's display details (owning Vendor, or Operator/Admin)
exports.updateStall = async (req, res, next) => {
  try {
    const existing = await stallModel.findRaw(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Stall not found." });
    }

    const isStaff = req.user.role === "Operator" || req.user.role === "Admin";
    const ownsIt = req.user.role === "Vendor" && existing.OwnerID === req.user.userId;
    if (!isStaff && !ownsIt) {
      return res.status(403).json({ success: false, message: "You do not have permission to edit this stall." });
    }

    const { stallName, description, imageUrl } = req.body;
    const updated = await stallModel.update(req.params.id, {
      stallName: stallName ?? existing.StallName,
      description: description ?? existing.Description,
      imageUrl: imageUrl ?? existing.ImageURL,
    });
    res.status(200).json({ success: true, message: "Stall updated.", data: updated });
  } catch (err) {
    next(err);
  }
};

//DELETE: retire a stall (Operator/Admin only)
exports.deleteStall = async (req, res, next) => {
  try {
    const existing = await stallModel.findRaw(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Stall not found." });
    }

    await stallModel.remove(req.params.id);
    res.status(200).json({ success: true, message: "Stall deleted." });
  } catch (err) {
    next(err);
  }
};
