/*
Owner: Kenneth
Unit tests for controllers/payments.controller.js
*/

jest.mock("../dbConfig", () => ({
  sql: { VarChar: "VarChar", Int: "Int", Decimal: () => "Decimal" },
  poolPromise: Promise.resolve({}),
}));
jest.mock("../models/payment.model");

const paymentModel = require("../models/payment.model");
const paymentsController = require("../controllers/payments.controller");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("payments.controller", () => {
  let res, next;

  beforeEach(() => {
    res = mockRes();
    next = jest.fn();
  });

  describe("createPayment", () => {
    const patron = { userId: 6, role: "Patron" };

    it("returns 201 on a successful simulated payment for the patron who placed the order", async () => {
      paymentModel.findOrderById.mockResolvedValue({ OrderID: 1, PatronID: 6, TotalAmount: 12.5 });
      paymentModel.findByOrderId.mockResolvedValue(null);
      paymentModel.create.mockResolvedValue({ PaymentID: 1, PaymentStatus: "Success", Amount: 12.5 });

      await paymentsController.createPayment(
        { body: { orderId: 1, paymentMethod: "PayNow" }, user: patron },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("returns 400 when orderId or paymentMethod is missing", async () => {
      await paymentsController.createPayment({ body: { orderId: 1 }, user: patron }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(paymentModel.findOrderById).not.toHaveBeenCalled();
    });

    it("returns 400 for an unsupported paymentMethod", async () => {
      await paymentsController.createPayment(
        { body: { orderId: 1, paymentMethod: "Bitcoin" }, user: patron },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 404 when the order does not exist", async () => {
      paymentModel.findOrderById.mockResolvedValue(null);

      await paymentsController.createPayment(
        { body: { orderId: 999, paymentMethod: "Cash" }, user: patron },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 403 when a different patron tries to pay for someone else's order", async () => {
      paymentModel.findOrderById.mockResolvedValue({ OrderID: 1, PatronID: 6, TotalAmount: 12.5 });

      await paymentsController.createPayment(
        { body: { orderId: 1, paymentMethod: "Cash" }, user: { userId: 99, role: "Patron" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(paymentModel.create).not.toHaveBeenCalled();
    });

    it("allows any authenticated user to pay for a guest order (PatronID null)", async () => {
      paymentModel.findOrderById.mockResolvedValue({ OrderID: 2, PatronID: null, TotalAmount: 8.0 });
      paymentModel.findByOrderId.mockResolvedValue(null);
      paymentModel.create.mockResolvedValue({ PaymentID: 2, PaymentStatus: "Success", Amount: 8.0 });

      await paymentsController.createPayment(
        { body: { orderId: 2, paymentMethod: "Cash" }, user: { userId: 99, role: "Patron" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("allows Operator to pay/reconcile on behalf of another patron's order", async () => {
      paymentModel.findOrderById.mockResolvedValue({ OrderID: 1, PatronID: 6, TotalAmount: 12.5 });
      paymentModel.findByOrderId.mockResolvedValue(null);
      paymentModel.create.mockResolvedValue({ PaymentID: 1, PaymentStatus: "Success", Amount: 12.5 });

      await paymentsController.createPayment(
        { body: { orderId: 1, paymentMethod: "Cash" }, user: { userId: 2, role: "Operator" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("returns 409 when the order has already been paid for", async () => {
      paymentModel.findOrderById.mockResolvedValue({ OrderID: 1, PatronID: 6, TotalAmount: 12.5 });
      paymentModel.findByOrderId.mockResolvedValue({ PaymentID: 1 });

      await paymentsController.createPayment(
        { body: { orderId: 1, paymentMethod: "Cash" }, user: patron },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe("getPaymentByOrder", () => {
    it("returns the payment for the owning patron", async () => {
      paymentModel.findOrderById.mockResolvedValue({ OrderID: 1, PatronID: 6 });
      paymentModel.findByOrderId.mockResolvedValue({ PaymentID: 1, PaymentStatus: "Success" });

      await paymentsController.getPaymentByOrder(
        { params: { orderId: "1" }, user: { userId: 6, role: "Patron" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 403 when a different patron tries to view someone else's payment", async () => {
      paymentModel.findOrderById.mockResolvedValue({ OrderID: 1, PatronID: 6 });

      await paymentsController.getPaymentByOrder(
        { params: { orderId: "1" }, user: { userId: 99, role: "Patron" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(paymentModel.findByOrderId).not.toHaveBeenCalled();
    });

    it("returns 404 when the order itself does not exist", async () => {
      paymentModel.findOrderById.mockResolvedValue(null);

      await paymentsController.getPaymentByOrder(
        { params: { orderId: "999" }, user: { userId: 6, role: "Patron" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 404 when the order exists but has no payment yet", async () => {
      paymentModel.findOrderById.mockResolvedValue({ OrderID: 1, PatronID: 6 });
      paymentModel.findByOrderId.mockResolvedValue(null);

      await paymentsController.getPaymentByOrder(
        { params: { orderId: "1" }, user: { userId: 6, role: "Patron" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("updatePaymentStatus", () => {
    it("updates status for the owning patron", async () => {
      paymentModel.findById.mockResolvedValue({ PaymentID: 1, OrderID: 1 });
      paymentModel.findOrderById.mockResolvedValue({ OrderID: 1, PatronID: 6 });
      paymentModel.updateStatus.mockResolvedValue({ PaymentID: 1, PaymentStatus: "Success" });

      await paymentsController.updatePaymentStatus(
        { params: { id: "1" }, body: { status: "Success" }, user: { userId: 6, role: "Patron" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 for an invalid status value", async () => {
      await paymentsController.updatePaymentStatus(
        { params: { id: "1" }, body: { status: "Refunded" }, user: { userId: 6, role: "Patron" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(paymentModel.findById).not.toHaveBeenCalled();
    });

    it("returns 404 when the payment does not exist", async () => {
      paymentModel.findById.mockResolvedValue(null);

      await paymentsController.updatePaymentStatus(
        { params: { id: "999" }, body: { status: "Success" }, user: { userId: 6, role: "Patron" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 403 when a different patron tries to update someone else's payment", async () => {
      paymentModel.findById.mockResolvedValue({ PaymentID: 1, OrderID: 1 });
      paymentModel.findOrderById.mockResolvedValue({ OrderID: 1, PatronID: 6 });

      await paymentsController.updatePaymentStatus(
        { params: { id: "1" }, body: { status: "Success" }, user: { userId: 99, role: "Patron" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(paymentModel.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe("deletePayment", () => {
    it("deletes when the payment exists (route already restricts to Operator/Admin)", async () => {
      paymentModel.findById.mockResolvedValue({ PaymentID: 1 });

      await paymentsController.deletePayment({ params: { id: "1" } }, res, next);

      expect(paymentModel.remove).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 when the payment does not exist", async () => {
      paymentModel.findById.mockResolvedValue(null);

      await paymentsController.deletePayment({ params: { id: "999" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(paymentModel.remove).not.toHaveBeenCalled();
    });
  });
});
