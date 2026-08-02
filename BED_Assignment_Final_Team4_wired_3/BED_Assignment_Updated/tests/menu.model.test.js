/*
Owner: Wayne
Unit tests for models/menu.model.js  (MODEL layer)
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
    sql: { VarChar: "VarChar", Int: "Int", Decimal: () => "Decimal", Bit: "Bit" },
    poolPromise: Promise.resolve({ request: () => mockRequest }),
    __mockRequest: mockRequest,
    __mockQuery: mockQuery,
  };
});

const { __mockRequest, __mockQuery } = require("../dbConfig");
const menuModel = require("../models/menu.model");

describe("menu.model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("binds all six columns and returns the inserted row", async () => {
      const inserted = { ItemID: 1, ItemName: "Chicken Rice" };
      __mockQuery.mockResolvedValue({ recordset: [inserted] });

      const result = await menuModel.create({ stallId: 1, itemName: "Chicken Rice", description: "Tasty", price: 4.5, category: "Main", imageUrl: null });

      expect(result).toEqual(inserted);
      expect(__mockRequest.input).toHaveBeenCalledWith("price", "Decimal", 4.5);
      expect(__mockRequest.input).toHaveBeenCalledTimes(6);
    });
  });

  describe("addCuisines", () => {
    it("inserts one row per cuisineId into the junction table", async () => {
      __mockQuery.mockResolvedValue({});

      await menuModel.addCuisines(1, [2, 5, 9]);

      expect(__mockQuery).toHaveBeenCalledTimes(3);
      expect(__mockQuery.mock.calls[0][0]).toContain("INSERT INTO MenuItemCuisines");
      expect(__mockRequest.input).toHaveBeenCalledWith("cuisineId", "Int", 2);
      expect(__mockRequest.input).toHaveBeenCalledWith("cuisineId", "Int", 5);
      expect(__mockRequest.input).toHaveBeenCalledWith("cuisineId", "Int", 9);
    });

    it("makes no query at all for an empty cuisineIds array", async () => {
      await menuModel.addCuisines(1, []);

      expect(__mockQuery).not.toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    it("returns null when the item does not exist", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await menuModel.findById(999)).toBeNull();
    });
  });

  describe("update", () => {
    it("updates all six editable columns via a single query", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ ItemID: 1 }] });

      await menuModel.update(1, { itemName: "New", description: "d", price: 5, category: "Main", isAvailable: true, imageUrl: null });

      const sqlSent = __mockQuery.mock.calls[0][0];
      expect(sqlSent).toContain("ItemName = @itemName");
      expect(sqlSent).toContain("IsAvailable = @isAvailable");
    });
  });

  describe("remove", () => {
    it("deletes by ItemID", async () => {
      __mockQuery.mockResolvedValue({});

      await menuModel.remove(1);

      expect(__mockQuery.mock.calls[0][0]).toContain("DELETE FROM MenuItems WHERE ItemID = @id");
    });
  });

  describe("findCuisinesForItem", () => {
    it("joins MenuItemCuisines to Cuisines and orders alphabetically", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ CuisineID: 1, Name: "Chinese" }] });

      const result = await menuModel.findCuisinesForItem(1);

      expect(result).toEqual([{ CuisineID: 1, Name: "Chinese" }]);
      const sqlSent = __mockQuery.mock.calls[0][0];
      expect(sqlSent).toContain("JOIN Cuisines c ON c.CuisineID = mic.CuisineID");
      expect(sqlSent).toContain("ORDER BY c.Name");
    });

    it("returns an empty array when the item has no cuisines tagged", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await menuModel.findCuisinesForItem(1)).toEqual([]);
    });
  });

  describe("listAllCuisines", () => {
    it("queries the Cuisines table with no filters, ordered by name", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ CuisineID: 1, Name: "Chinese" }, { CuisineID: 2, Name: "Halal" }] });

      const result = await menuModel.listAllCuisines();

      expect(result).toHaveLength(2);
      expect(__mockQuery.mock.calls[0][0]).toBe("SELECT CuisineID, Name FROM Cuisines ORDER BY Name");
    });
  });
});
