/*
Owner: Wayne
Unit tests for controllers/orders.controller.js

This is a second worked example, deliberately different from the users one.
It shows how to test:
  - a controller that branches on whether req.user exists (guest vs patron)
  - loop-based validation over an array payload
  - a controller that composes TWO model calls into one response
Copy this shape for your own feature controllers.
*/

jest.mock("../dbConfig", () => ({
  sql: { VarChar: "VarChar", Int: "Int", Decimal: () => "Decimal" },
  poolPromise: Promise.resolve({}),
}));
jest.mock("../models/order.model");

const orderModel = require("../models/order.model");
const ordersController = require("../controllers/orders.controller");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("orders.controller", () => {
  let res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockRes();
    next = jest.fn();
  });

  describe("createOrder", () => {
    const items = [{ itemId: 10, quantity: 2 }];

    it("returns 201 and passes the patronId through for a logged-in patron", async () => {
      orderModel.checkout.mockResolvedValue({ OrderID: 100, TotalAmount: 9.0 });

      await ordersController.createOrder(
        { body: { stallId: 3, items }, user: { userId: 55, role: "Patron" } },
        res,
        next
      );

      expect(orderModel.checkout).toHaveBeenCalledWith({ patronId: 55, stallId: 3, items });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("allows guest checkout by passing patronId as null when req.user is absent", async () => {
      orderModel.checkout.mockResolvedValue({ OrderID: 101 });

      await ordersController.createOrder({ body: { stallId: 3, items } }, res, next);

      expect(orderModel.checkout).toHaveBeenCalledWith({ patronId: null, stallId: 3, items });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("returns 400 when stallId is missing", async () => {
      await ordersController.createOrder({ body: { items } }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(orderModel.checkout).not.toHaveBeenCalled();
    });

    it("returns 400 for an empty items array", async () => {
      await ordersController.createOrder({ body: { stallId: 3, items: [] } }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(orderModel.checkout).not.toHaveBeenCalled();
    });

    it("returns 400 when items is not an array at all", async () => {
      await ordersController.createOrder({ body: { stallId: 3, items: "nasi lemak" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it.each([
      ["quantity of zero", { itemId: 10, quantity: 0 }],
      ["negative quantity", { itemId: 10, quantity: -3 }],
      ["missing itemId", { quantity: 1 }],
    ])("returns 400 for %s", async (_label, badItem) => {
      await ordersController.createOrder({ body: { stallId: 3, items: [badItem] } }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(orderModel.checkout).not.toHaveBeenCalled();
    });

    it("forwards model errors (e.g. failed transaction) to next()", async () => {
      const boom = Object.assign(new Error("Menu item 10 is currently unavailable."), { statusCode: 400 });
      orderModel.checkout.mockRejectedValue(boom);

      await ordersController.createOrder({ body: { stallId: 3, items } }, res, next);

      expect(next).toHaveBeenCalledWith(boom);
    });
  });

  describe("getOrderById", () => {
    it("merges the order header and its line items into one payload", async () => {
      orderModel.findById.mockResolvedValue({ OrderID: 100, TotalAmount: 9.0 });
      orderModel.findItemsByOrderId.mockResolvedValue([{ ItemID: 10, Quantity: 2 }]);

      await ordersController.getOrderById({ params: { id: "100" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { OrderID: 100, TotalAmount: 9.0, items: [{ ItemID: 10, Quantity: 2 }] },
      });
    });

    it("returns 404 and skips the second query when the order does not exist", async () => {
      orderModel.findById.mockResolvedValue(null);

      await ordersController.getOrderById({ params: { id: "999" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(orderModel.findItemsByOrderId).not.toHaveBeenCalled();
    });
  });

  describe("updateOrderStatus", () => {
    it.each(["Pending", "Preparing", "Ready", "Collected", "Cancelled"])(
      "accepts the valid status %s",
      async (status) => {
        orderModel.updateStatus.mockResolvedValue({ OrderID: 100, Status: status });

        await ordersController.updateOrderStatus({ params: { id: "100" }, body: { status } }, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
      }
    );

    it("returns 400 for a status outside the allowed list", async () => {
      await ordersController.updateOrderStatus(
        { params: { id: "100" }, body: { status: "Teleported" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(orderModel.updateStatus).not.toHaveBeenCalled();
    });

    it("returns 404 when the order id does not exist", async () => {
      orderModel.updateStatus.mockResolvedValue(null);

      await ordersController.updateOrderStatus(
        { params: { id: "9999" }, body: { status: "Ready" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
