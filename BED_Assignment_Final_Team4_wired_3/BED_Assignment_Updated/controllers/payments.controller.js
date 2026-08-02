/*
Owner: Kenneth 
Feature: Payment Confirmation & Multiple Payment Options (US8, US9)
*/

const paymentModel = require("../models/payment.model");

const VALID_METHODS = ["Cash", "NETS", "PayNow", "CreditCard"];

// A guest order (PatronID null) has no owner to restrict to, so anyone
// authenticated may act on it. A registered order restricts to the patron
// who placed it, or Operator/Admin for reconciliation.
function canManagePayment(order, user) {
  if (order.PatronID === null) return true;
  if (user.role === "Operator" || user.role === "Admin") return true;
  return order.PatronID === user.userId;
}

//CREATE: submit payment for an order
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
    if (!canManagePayment(order, req.user)) {
      return res.status(403).json({ success: false, message: "You do not have permission to pay for this order." });
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

//READ: get payment status for an order
exports.getPaymentByOrder = async (req, res, next) => {
  try {
    const order = await paymentModel.findOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    if (!canManagePayment(order, req.user)) {
      return res.status(403).json({ success: false, message: "You do not have permission to view this payment." });
    }

    const payment = await paymentModel.findByOrderId(req.params.orderId);
    if (!payment) {
      return res.status(404).json({ success: false, message: "No payment found for this order." });
    }
    res.status(200).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

//UPDATE: change payment status (e.g. retry a failed payment) 
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Success", "Failed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(", ")}` });
    }

    const existing = await paymentModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }
    const order = await paymentModel.findOrderById(existing.OrderID);
    if (order && !canManagePayment(order, req.user)) {
      return res.status(403).json({ success: false, message: "You do not have permission to update this payment." });
    }

    const updated = await paymentModel.updateStatus(req.params.id, status);
    res.status(200).json({ success: true, message: "Payment status updated.", data: updated });
  } catch (err) {
    next(err);
  }
};

//DELETE: reverse a payment record (Operator/Admin only - see routes/payments.routes.js)
exports.deletePayment = async (req, res, next) => {
  try {
    const existing = await paymentModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }

    await paymentModel.remove(req.params.id);
    res.status(200).json({ success: true, message: "Payment deleted." });
  } catch (err) {
    next(err);
  }
};
