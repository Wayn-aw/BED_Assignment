/*
Owner: Wayne
Unit tests for controllers/menu.controller.js
*/

jest.mock("../dbConfig", () => ({
  sql: { VarChar: "VarChar", Int: "Int", Decimal: () => "Decimal", Bit: "Bit" },
  poolPromise: Promise.resolve({}),
}));
jest.mock("../models/menu.model");
jest.mock("../models/stall.model");

const menuModel = require("../models/menu.model");
const stallModel = require("../models/stall.model");
const menuController = require("../controllers/menu.controller");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("menu.controller", () => {
  let res, next;
  const vendor = { userId: 3, role: "Vendor" };

  beforeEach(() => {
    res = mockRes();
    next = jest.fn();
  });

  describe("createMenuItem", () => {
    it("returns 201 for a valid item owned by the calling Vendor", async () => {
      stallModel.isOwnedBy.mockResolvedValue(true);
      menuModel.create.mockResolvedValue({ ItemID: 1, ItemName: "Chicken Rice" });

      await menuController.createMenuItem(
        { body: { stallId: 1, itemName: "Chicken Rice", price: 4.5 }, user: vendor },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("attaches cuisines when cuisineIds is a non-empty array", async () => {
      stallModel.isOwnedBy.mockResolvedValue(true);
      menuModel.create.mockResolvedValue({ ItemID: 1 });

      await menuController.createMenuItem(
        { body: { stallId: 1, itemName: "Chicken Rice", price: 4.5, cuisineIds: [1, 4] }, user: vendor },
        res,
        next
      );

      expect(menuModel.addCuisines).toHaveBeenCalledWith(1, [1, 4]);
    });

    it("does not call addCuisines when cuisineIds is omitted", async () => {
      stallModel.isOwnedBy.mockResolvedValue(true);
      menuModel.create.mockResolvedValue({ ItemID: 1 });

      await menuController.createMenuItem({ body: { stallId: 1, itemName: "Chicken Rice", price: 4.5 }, user: vendor }, res, next);

      expect(menuModel.addCuisines).not.toHaveBeenCalled();
    });

    it("returns 400 when a required field is missing", async () => {
      await menuController.createMenuItem({ body: { stallId: 1, price: 4.5 }, user: vendor }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(stallModel.isOwnedBy).not.toHaveBeenCalled();
    });

    it("returns 400 for a negative price", async () => {
      await menuController.createMenuItem({ body: { stallId: 1, itemName: "X", price: -1 }, user: vendor }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 for an invalid category", async () => {
      await menuController.createMenuItem(
        { body: { stallId: 1, itemName: "X", price: 4.5, category: "Dessertz" }, user: vendor },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 403 when the Vendor does not own the stall", async () => {
      stallModel.isOwnedBy.mockResolvedValue(false);

      await menuController.createMenuItem({ body: { stallId: 1, itemName: "X", price: 4.5 }, user: vendor }, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(menuModel.create).not.toHaveBeenCalled();
    });
  });

  describe("getMenuItemById", () => {
    it("merges the item with its cuisines array", async () => {
      menuModel.findById.mockResolvedValue({ ItemID: 1, ItemName: "Chicken Rice" });
      menuModel.findCuisinesForItem.mockResolvedValue([{ CuisineID: 1, Name: "Chinese" }]);

      await menuController.getMenuItemById({ params: { id: "1" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { ItemID: 1, ItemName: "Chicken Rice", cuisines: [{ CuisineID: 1, Name: "Chinese" }] },
      });
    });

    it("returns 404 and skips the cuisines lookup when the item does not exist", async () => {
      menuModel.findById.mockResolvedValue(null);

      await menuController.getMenuItemById({ params: { id: "999" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(menuModel.findCuisinesForItem).not.toHaveBeenCalled();
    });
  });

  describe("updateMenuItem", () => {
    const existing = { ItemID: 1, StallID: 1, ItemName: "Old", Description: "d", Price: 4.5, Category: "Main", IsAvailable: true, ImageURL: null };

    it("updates when the caller owns the stall", async () => {
      menuModel.findById.mockResolvedValue(existing);
      stallModel.isOwnedBy.mockResolvedValue(true);
      menuModel.update.mockResolvedValue({ ...existing, Price: 5 });

      await menuController.updateMenuItem({ params: { id: "1" }, body: { price: 5 }, user: vendor }, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 403 when the caller does not own the stall", async () => {
      menuModel.findById.mockResolvedValue(existing);
      stallModel.isOwnedBy.mockResolvedValue(false);

      await menuController.updateMenuItem({ params: { id: "1" }, body: { price: 5 }, user: vendor }, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(menuModel.update).not.toHaveBeenCalled();
    });

    it("returns 404 when the item does not exist", async () => {
      menuModel.findById.mockResolvedValue(null);

      await menuController.updateMenuItem({ params: { id: "999" }, body: {}, user: vendor }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 400 for an invalid category on update", async () => {
      menuModel.findById.mockResolvedValue(existing);
      stallModel.isOwnedBy.mockResolvedValue(true);

      await menuController.updateMenuItem(
        { params: { id: "1" }, body: { category: "Snacks" }, user: vendor },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 for a negative price on update", async () => {
      menuModel.findById.mockResolvedValue(existing);
      stallModel.isOwnedBy.mockResolvedValue(true);

      await menuController.updateMenuItem({ params: { id: "1" }, body: { price: -5 }, user: vendor }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("deleteMenuItem", () => {
    const existing = { ItemID: 1, StallID: 1 };

    it("deletes when the caller owns the stall", async () => {
      menuModel.findById.mockResolvedValue(existing);
      stallModel.isOwnedBy.mockResolvedValue(true);

      await menuController.deleteMenuItem({ params: { id: "1" }, user: vendor }, res, next);

      expect(menuModel.remove).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 403 when the caller does not own the stall", async () => {
      menuModel.findById.mockResolvedValue(existing);
      stallModel.isOwnedBy.mockResolvedValue(false);

      await menuController.deleteMenuItem({ params: { id: "1" }, user: vendor }, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(menuModel.remove).not.toHaveBeenCalled();
    });

    it("returns 404 when the item does not exist", async () => {
      menuModel.findById.mockResolvedValue(null);

      await menuController.deleteMenuItem({ params: { id: "999" }, user: vendor }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
