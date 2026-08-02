/*
Owner: Wayne
Unit tests for models/order.model.js  (MODEL layer)

checkout() uses a real SQL transaction (sql.Transaction + sql.Request),
unlike the simple pool.request() pattern most other models use. This mock
lets a test queue up exactly what each sequential query should return, and
inspect whether the transaction was committed or rolled back.
*/

jest.mock("../dbConfig", () => {
  let queryResponses = [];
  let lastTransaction = null;

  const RequestMock = jest.fn().mockImplementation(() => ({
    input: jest.fn(function () {
      return this;
    }),
    query: jest.fn(() => {
      const next = queryResponses.shift();
      if (next instanceof Error) return Promise.reject(next);
      return Promise.resolve(next);
    }),
  }));

  const TransactionMock = jest.fn().mockImplementation(() => {
    lastTransaction = {
      begin: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };
    return lastTransaction;
  });

  // Separate mock for the plain pool.request() path used by
  // findById/findByPatronId/findItemsByOrderId/updateStatus.
  const mockQuery = jest.fn();
  const mockRequest = {
    input: jest.fn(function () {
      return this;
    }),
    query: mockQuery,
  };

  return {
    sql: { Int: "Int", VarChar: "VarChar", Decimal: () => "Decimal", Transaction: TransactionMock, Request: RequestMock },
    poolPromise: Promise.resolve({ request: () => mockRequest }),
    __setQueryResponses: (arr) => {
      queryResponses = arr;
    },
    __getLastTransaction: () => lastTransaction,
    __mockRequest: mockRequest,
    __mockQuery: mockQuery,
  };
});

const dbConfig = require("../dbConfig");
const { __mockRequest, __mockQuery } = dbConfig;
const orderModel = require("../models/order.model");

describe("order.model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dbConfig.__setQueryResponses([]);
  });

  describe("checkout", () => {
    it("resolves each item, inserts the order, inserts order items, and commits", async () => {
      dbConfig.__setQueryResponses([
        { recordset: [{ ItemID: 10, Price: 5, IsAvailable: true }] }, // findMenuItemForStall
        { recordset: [{ OrderID: 100, TotalAmount: 10 }] }, // INSERT Orders
        {}, // INSERT OrderItems
      ]);

      const result = await orderModel.checkout({ patronId: 6, stallId: 1, items: [{ itemId: 10, quantity: 2 }] });

      expect(result).toEqual({ OrderID: 100, TotalAmount: 10 });
      expect(dbConfig.__getLastTransaction().commit).toHaveBeenCalled();
      expect(dbConfig.__getLastTransaction().rollback).not.toHaveBeenCalled();
    });

    it("resolves multiple items before inserting the order (order matters for the total)", async () => {
      dbConfig.__setQueryResponses([
        { recordset: [{ ItemID: 10, Price: 5, IsAvailable: true }] },
        { recordset: [{ ItemID: 11, Price: 2, IsAvailable: true }] },
        { recordset: [{ OrderID: 100, TotalAmount: 12 }] },
        {},
        {},
      ]);

      const result = await orderModel.checkout({
        patronId: 6,
        stallId: 1,
        items: [
          { itemId: 10, quantity: 2 },
          { itemId: 11, quantity: 1 },
        ],
      });

      expect(result.OrderID).toBe(100);
      expect(dbConfig.__getLastTransaction().commit).toHaveBeenCalled();
    });

    it("rolls back and throws a 400 when an item does not belong to the stall", async () => {
      dbConfig.__setQueryResponses([{ recordset: [] }]);

      await expect(
        orderModel.checkout({ patronId: 6, stallId: 1, items: [{ itemId: 999, quantity: 1 }] })
      ).rejects.toThrow("does not belong to this stall");

      expect(dbConfig.__getLastTransaction().rollback).toHaveBeenCalled();
      expect(dbConfig.__getLastTransaction().commit).not.toHaveBeenCalled();
    });

    it("rolls back and throws a 400 when an item is unavailable", async () => {
      dbConfig.__setQueryResponses([{ recordset: [{ ItemID: 10, Price: 5, IsAvailable: false }] }]);

      await expect(
        orderModel.checkout({ patronId: 6, stallId: 1, items: [{ itemId: 10, quantity: 1 }] })
      ).rejects.toThrow("currently unavailable");

      expect(dbConfig.__getLastTransaction().rollback).toHaveBeenCalled();
    });

    it("rolls back and re-throws when the Orders insert itself fails", async () => {
      const dbErr = new Error("connection reset");
      dbConfig.__setQueryResponses([{ recordset: [{ ItemID: 10, Price: 5, IsAvailable: true }] }, dbErr]);

      await expect(
        orderModel.checkout({ patronId: 6, stallId: 1, items: [{ itemId: 10, quantity: 1 }] })
      ).rejects.toThrow("connection reset");

      expect(dbConfig.__getLastTransaction().rollback).toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    it("returns null when the order does not exist", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await orderModel.findById(999)).toBeNull();
    });
  });

  describe("findByPatronId", () => {
    it("joins Stalls for the display name and scopes to the given patron, newest first", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ OrderID: 1, StallName: "Ah Hock" }] });

      const result = await orderModel.findByPatronId(6);

      expect(result).toEqual([{ OrderID: 1, StallName: "Ah Hock" }]);
      expect(__mockRequest.input).toHaveBeenCalledWith("patronId", "Int", 6);
      const sqlSent = __mockQuery.mock.calls[0][0];
      expect(sqlSent).toContain("JOIN Stalls s ON s.StallID = o.StallID");
      expect(sqlSent).toContain("WHERE o.PatronID = @patronId");
      expect(sqlSent).toContain("ORDER BY o.OrderDate DESC");
    });
  });

  describe("findItemsByOrderId", () => {
    it("joins MenuItems so ItemName is available without a second round trip", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ OrderItemID: 1, ItemName: "Chicken Rice" }] });

      const result = await orderModel.findItemsByOrderId(1);

      expect(result).toEqual([{ OrderItemID: 1, ItemName: "Chicken Rice" }]);
      expect(__mockQuery.mock.calls[0][0]).toContain("JOIN MenuItems mi ON mi.ItemID = oi.ItemID");
    });
  });

  describe("updateStatus", () => {
    it("returns null when the order does not exist", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await orderModel.updateStatus(999, "Ready")).toBeNull();
    });
  });
});
