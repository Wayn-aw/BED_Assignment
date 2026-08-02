/*
Owner: Jeremiah
Unit tests for controllers/promotions.controller.js
*/

jest.mock("../dbConfig", () => ({
  sql: { VarChar: "VarChar", Int: "Int", DateTime: "DateTime" },
  poolPromise: Promise.resolve({}),
}));
jest.mock("../models/promotion.model");
jest.mock("../models/stall.model");

const promotionModel = require("../models/promotion.model");
const stallModel = require("../models/stall.model");
const promotionsController = require("../controllers/promotions.controller");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("promotions.controller", () => {
  let res, next;
  const vendor = { userId: 3, role: "Vendor" };
  const validBody = { stallId: 1, title: "10% Off", discountPercentage: 10, startDate: "2026-01-01", endDate: "2026-01-31" };

  beforeEach(() => {
    res = mockRes();
    next = jest.fn();
  });

  describe("createPromotion", () => {
    it("returns 201 for a valid promotion owned by the Vendor", async () => {
      stallModel.isOwnedBy.mockResolvedValue(true);
      promotionModel.create.mockResolvedValue({ PromoID: 1, ...validBody });

      await promotionsController.createPromotion({ body: validBody, user: vendor }, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("returns 400 when a required field is missing", async () => {
      const { title, ...rest } = validBody;
      await promotionsController.createPromotion({ body: rest, user: vendor }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(stallModel.isOwnedBy).not.toHaveBeenCalled();
    });

    it.each([0, 101])("returns 400 for an out-of-range discountPercentage of %i", async (pct) => {
      await promotionsController.createPromotion(
        { body: { ...validBody, discountPercentage: pct }, user: vendor },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when endDate is not after startDate", async () => {
      await promotionsController.createPromotion(
        { body: { ...validBody, startDate: "2026-02-01", endDate: "2026-01-01" }, user: vendor },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 403 when the Vendor does not own the stall", async () => {
      stallModel.isOwnedBy.mockResolvedValue(false);

      await promotionsController.createPromotion({ body: validBody, user: vendor }, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(promotionModel.create).not.toHaveBeenCalled();
    });
  });

  describe("getPromotionsForStall", () => {
    it("returns promotions for the stall", async () => {
      promotionModel.findByStallId.mockResolvedValue([{ PromoID: 1 }]);

      await promotionsController.getPromotionsForStall({ params: { id: "1" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("updatePromotion", () => {
    const existing = { PromoID: 1, StallID: 1, Title: "Old", DiscountPercentage: 10, StartDate: "2026-01-01", EndDate: "2026-01-31" };

    it("updates when the caller owns the stall, keeping omitted fields unchanged", async () => {
      promotionModel.findById.mockResolvedValue(existing);
      stallModel.isOwnedBy.mockResolvedValue(true);
      promotionModel.update.mockResolvedValue({ ...existing, Title: "New Title" });

      await promotionsController.updatePromotion(
        { params: { id: "1" }, body: { title: "New Title" }, user: vendor },
        res,
        next
      );

      expect(promotionModel.update).toHaveBeenCalledWith("1", {
        title: "New Title",
        discountPercentage: 10,
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 403 when the caller does not own the stall", async () => {
      promotionModel.findById.mockResolvedValue(existing);
      stallModel.isOwnedBy.mockResolvedValue(false);

      await promotionsController.updatePromotion({ params: { id: "1" }, body: {}, user: vendor }, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(promotionModel.update).not.toHaveBeenCalled();
    });

    it("returns 404 when the promotion does not exist", async () => {
      promotionModel.findById.mockResolvedValue(null);

      await promotionsController.updatePromotion({ params: { id: "999" }, body: {}, user: vendor }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 400 when the resulting discountPercentage is out of range", async () => {
      promotionModel.findById.mockResolvedValue(existing);
      stallModel.isOwnedBy.mockResolvedValue(true);

      await promotionsController.updatePromotion(
        { params: { id: "1" }, body: { discountPercentage: 150 }, user: vendor },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(promotionModel.update).not.toHaveBeenCalled();
    });

    it("returns 400 when the resulting endDate is not after startDate", async () => {
      promotionModel.findById.mockResolvedValue(existing);
      stallModel.isOwnedBy.mockResolvedValue(true);

      await promotionsController.updatePromotion(
        { params: { id: "1" }, body: { startDate: "2026-02-01", endDate: "2026-01-01" }, user: vendor },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("deletePromotion", () => {
    const existing = { PromoID: 1, StallID: 1 };

    it("deletes when the caller owns the stall", async () => {
      promotionModel.findById.mockResolvedValue(existing);
      stallModel.isOwnedBy.mockResolvedValue(true);

      await promotionsController.deletePromotion({ params: { id: "1" }, user: vendor }, res, next);

      expect(promotionModel.remove).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 403 when the caller does not own the stall", async () => {
      promotionModel.findById.mockResolvedValue(existing);
      stallModel.isOwnedBy.mockResolvedValue(false);

      await promotionsController.deletePromotion({ params: { id: "1" }, user: vendor }, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(promotionModel.remove).not.toHaveBeenCalled();
    });

    it("returns 404 when the promotion does not exist", async () => {
      promotionModel.findById.mockResolvedValue(null);

      await promotionsController.deletePromotion({ params: { id: "999" }, user: vendor }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
