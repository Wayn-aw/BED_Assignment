/**
 * routes/payments.routes.js
 * Owner: Kenneth | Feature: Payment Confirmation & Multiple Payment Options (US8, US9)
 */

const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/payments.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, paymentsController.createPayment);
router.get("/:orderId", verifyToken, paymentsController.getPaymentByOrder);
router.put("/:id", verifyToken, paymentsController.updatePaymentStatus);

module.exports = router;
