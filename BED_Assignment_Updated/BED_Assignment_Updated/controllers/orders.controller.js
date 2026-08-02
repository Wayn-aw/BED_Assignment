/*
Owner: Wayne 
Feature: Add to Cart & Checkout (US3)
Supports both registered patrons and guest checkout (patronId may be null), 
matching the "guest order" suggested feature.
 */

const orderModel = require("../models/order.model");

const VALID_STATUSES = ["Pending", "Preparing", "Ready", "Collected", "Cancelled"];

//CREATE: checkout the cart
exports.createOrder = async (req, res, next) => {
  try {
    const { stallId, items } = req.body; // items: [{ itemId, quantity }]
    const patronId = req.user ? req.user.userId : null; // guest checkout allowed

    if (!stallId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "stallId and a non-empty items array are required." });
    }
    for (const it of items) {
      if (!it.itemId || !it.quantity || it.quantity <= 0) {
        return res.status(400).json({ success: false, message: "Each item needs a valid itemId and quantity > 0." });
      }
    }

    const order = await orderModel.checkout({ patronId, stallId, items });
    res.status(201).json({ success: true, message: "Order placed successfully.", data: order });
  } catch (err) {
    next(err);
  }
};

//READ: order + its items
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await orderModel.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    const items = await orderModel.findItemsByOrderId(req.params.id);
    res.status(200).json({ success: true, data: { ...order, items } });
  } catch (err) {
    next(err);
  }
};

//UPDATE: vendor advances order status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    const updated = await orderModel.updateStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    res.status(200).json({ success: true, message: "Order status updated.", data: updated });
  } catch (err) {
    next(err);
  }
};
