/**
 * routes/orders.routes.js
 * Owner: Wayne | Feature: Add to Cart & Checkout (US3)
 */

const express = require("express");
const router = express.Router();
const ordersController = require("../controllers/orders.controller");
const { optionalAuth, verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.post("/", optionalAuth, ordersController.createOrder); // guest or patron checkout
router.get("/:id", optionalAuth, ordersController.getOrderById);
router.put("/:id", verifyToken, requireRole("Vendor"), ordersController.updateOrderStatus);

module.exports = router;
