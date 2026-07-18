/**
 * controllers/menu.controller.js
 * Owner: Wayne | Feature: Vendor Menu CRUD (US6)
 *
 * Only the Vendor who owns the stall may modify its menu items.
 */

const menuModel = require("../models/menu.model");
const stallModel = require("../models/stall.model");

const VALID_CATEGORIES = ["Main", "Drink", "Dessert", "Side"];

// ---- CREATE ----
exports.createMenuItem = async (req, res, next) => {
  try {
    const { stallId, itemName, description, price, category, cuisineIds } = req.body;

    if (!stallId || !itemName || price === undefined) {
      return res.status(400).json({ success: false, message: "stallId, itemName and price are required." });
    }
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, message: "price must be a non-negative number." });
    }
    const finalCategory = category || "Main";
    if (!VALID_CATEGORIES.includes(finalCategory)) {
      return res.status(400).json({ success: false, message: `category must be one of: ${VALID_CATEGORIES.join(", ")}` });
    }

    const owns = await stallModel.isOwnedBy(stallId, req.user.userId);
    if (!owns) {
      return res.status(403).json({ success: false, message: "You do not have permission to add items to this stall." });
    }

    const newItem = await menuModel.create({ stallId, itemName, description, price, category: finalCategory });

    if (Array.isArray(cuisineIds) && cuisineIds.length > 0) {
      await menuModel.addCuisines(newItem.ItemID, cuisineIds);
    }

    res.status(201).json({ success: true, message: "Menu item created.", data: newItem });
  } catch (err) {
    next(err);
  }
};

// ---- READ: single item ----
exports.getMenuItemById = async (req, res, next) => {
  try {
    const item = await menuModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Menu item not found." });
    }
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

// ---- UPDATE ----
exports.updateMenuItem = async (req, res, next) => {
  try {
    const existing = await menuModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Menu item not found." });
    }

    const owns = await stallModel.isOwnedBy(existing.StallID, req.user.userId);
    if (!owns) {
      return res.status(403).json({ success: false, message: "You do not have permission to edit this item." });
    }

    const { itemName, description, price, category, isAvailable } = req.body;
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: `category must be one of: ${VALID_CATEGORIES.join(", ")}` });
    }
    if (price !== undefined && (isNaN(price) || price < 0)) {
      return res.status(400).json({ success: false, message: "price must be a non-negative number." });
    }

    const updated = await menuModel.update(req.params.id, {
      itemName: itemName ?? existing.ItemName,
      description: description ?? existing.Description,
      price: price ?? existing.Price,
      category: category ?? existing.Category,
      isAvailable: isAvailable ?? existing.IsAvailable,
    });

    res.status(200).json({ success: true, message: "Menu item updated.", data: updated });
  } catch (err) {
    next(err);
  }
};

// ---- DELETE ----
exports.deleteMenuItem = async (req, res, next) => {
  try {
    const existing = await menuModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Menu item not found." });
    }

    const owns = await stallModel.isOwnedBy(existing.StallID, req.user.userId);
    if (!owns) {
      return res.status(403).json({ success: false, message: "You do not have permission to delete this item." });
    }

    await menuModel.remove(req.params.id);
    res.status(200).json({ success: true, message: "Menu item deleted." });
  } catch (err) {
    next(err);
  }
};
