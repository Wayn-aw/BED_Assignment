/**
 * controllers/payments.controller.js
 * Owner: Kenneth | Feature: Payment Confirmation & Multiple Payment Options (US8, US9)
 */

const paymentModel = require("../models/payment.model");

const VALID_METHODS = ["Cash", "NETS", "PayNow", "CreditCard"];

// ---- CREATE: submit payment for an order ----
exports.createPayment = async (req, res, next) => {
  try {
    const { orderId, paymentMethod } = req.body;
    if (!orderId || !paymentMethod) {
      return res.status(400).json({ success: false, message: "orderId and paymentMethod are required." });
    }
    if (!VALID_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: `paymentMethod must be one of: ${VALID_METHODS.join(", ")}` });
    }

    const order = await paymentModel.findOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const existingPayment = await paymentModel.findByOrderId(orderId);
    if (existingPayment) {
      return res.status(409).json({ success: false, message: "This order has already been paid for." });
    }

    // Simulated payment gateway: mock success/failure the same way the
    // real bank-integration team's service will (per Appendix A, the bank
    // interface itself is handled by another team).
    const gatewaySucceeded = true; // swap for real gateway call in production
    const status = gatewaySucceeded ? "Success" : "Failed";

    const payment = await paymentModel.create({
      orderId,
      paymentMethod,
      amount: order.TotalAmount,
      status,
    });

    res.status(gatewaySucceeded ? 201 : 500).json({
      success: gatewaySucceeded,
      message: gatewaySucceeded ? "Payment successful." : "Payment failed. Please try again.",
      data: payment,
    });
  } catch (err) {
    next(err);
  }
};

// ---- READ: get payment status for an order ----
exports.getPaymentByOrder = async (req, res, next) => {
  try {
    const payment = await paymentModel.findByOrderId(req.params.orderId);
    if (!payment) {
      return res.status(404).json({ success: false, message: "No payment found for this order." });
    }
    res.status(200).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

// ---- UPDATE: change payment status (e.g. retry a failed payment) ----
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Success", "Failed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(", ")}` });
    }

    const updated = await paymentModel.updateStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }
    res.status(200).json({ success: true, message: "Payment status updated.", data: updated });
  } catch (err) {
    next(err);
  }
};
