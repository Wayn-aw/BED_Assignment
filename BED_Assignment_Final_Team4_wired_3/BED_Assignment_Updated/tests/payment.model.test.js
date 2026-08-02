/*
Owner: Kenneth
Unit tests for models/payment.model.js  (MODEL layer)
*/

jest.mock("../dbConfig", () => {
  const mockQuery = jest.fn();
  const mockRequest = {
    input: jest.fn(function () {
      return this;
    }),
    query: mockQuery,
  };
  return {
    sql: { VarChar: "VarChar", Int: "Int", Decimal: () => "Decimal" },
    poolPromise: Promise.resolve({ request: () => mockRequest }),
    __mockRequest: mockRequest,
    __mockQuery: mockQuery,
  };
});

const { __mockRequest, __mockQuery } = require("../dbConfig");
const paymentModel = require("../models/payment.model");

describe("payment.model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findOrderById", () => {
    it("selects PatronID (needed for the ownership check in the controller)", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ OrderID: 1, PatronID: 6, TotalAmount: 12.5 }] });

      const result = await paymentModel.findOrderById(1);

      expect(result.PatronID).toBe(6);
      expect(__mockQuery.mock.calls[0][0]).toContain("PatronID");
    });

    it("returns null when the order does not exist", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await paymentModel.findOrderById(999)).toBeNull();
    });
  });

  describe("findByOrderId", () => {
    it("returns null when no payment exists for the order yet", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await paymentModel.findByOrderId(1)).toBeNull();
    });
  });

  describe("findById", () => {
    it("queries by PaymentID, not OrderID", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ PaymentID: 1 }] });

      await paymentModel.findById(1);

      expect(__mockQuery.mock.calls[0][0]).toContain("WHERE PaymentID = @id");
    });
  });

  describe("create", () => {
    it("sets PaidAt to GETDATE() for a Success status", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ PaymentID: 1, PaymentStatus: "Success" }] });

      await paymentModel.create({ orderId: 1, paymentMethod: "Cash", amount: 12.5, status: "Success" });

      expect(__mockQuery.mock.calls[0][0]).toContain("GETDATE()");
      expect(__mockQuery.mock.calls[0][0]).not.toContain("VALUES (@orderId, @method, @amount, @status, NULL)");
    });

    it("sets PaidAt to NULL for a Failed status", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ PaymentID: 1, PaymentStatus: "Failed" }] });

      await paymentModel.create({ orderId: 1, paymentMethod: "Cash", amount: 12.5, status: "Failed" });

      expect(__mockQuery.mock.calls[0][0]).toContain("@status, NULL)");
    });
  });

  describe("updateStatus", () => {
    it("only refreshes PaidAt when the new status is Success, otherwise keeps the existing value", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ PaymentID: 1, PaymentStatus: "Success" }] });

      await paymentModel.updateStatus(1, "Success");

      const sqlSent = __mockQuery.mock.calls[0][0];
      expect(sqlSent).toContain("PaidAt = CASE WHEN @status = 'Success' THEN GETDATE() ELSE PaidAt END");
    });

    it("returns null when the payment does not exist", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await paymentModel.updateStatus(999, "Success")).toBeNull();
    });
  });

  describe("remove", () => {
    it("deletes by PaymentID", async () => {
      __mockQuery.mockResolvedValue({});

      await paymentModel.remove(1);

      expect(__mockQuery.mock.calls[0][0]).toContain("DELETE FROM Payments WHERE PaymentID = @id");
    });
  });
});
