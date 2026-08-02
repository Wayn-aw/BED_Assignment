/*
Owner: Yongsheng
Unit tests for controllers/rentals.controller.js
*/

jest.mock("../dbConfig", () => ({
  sql: { VarChar: "VarChar", Int: "Int", Date: "Date", Decimal: () => "Decimal" },
  poolPromise: Promise.resolve({}),
}));
jest.mock("../models/rental.model");
jest.mock("../models/stall.model");

const rentalModel = require("../models/rental.model");
const stallModel = require("../models/stall.model");
const rentalsController = require("../controllers/rentals.controller");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("rentals.controller", () => {
  let res, next;
  const validBody = { stallId: 1, startDate: "2026-01-01", endDate: "2026-12-31", monthlyRent: 1200 };

  beforeEach(() => {
    res = mockRes();
    next = jest.fn();
  });

  describe("createAgreement", () => {
    it("returns 201 for a valid agreement", async () => {
      stallModel.exists.mockResolvedValue(true);
      rentalModel.create.mockResolvedValue({ AgreementID: 1, ...validBody });

      await rentalsController.createAgreement({ body: validBody }, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("returns 400 when a required field is missing", async () => {
      const { monthlyRent, ...rest } = validBody;
      await rentalsController.createAgreement({ body: rest }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(stallModel.exists).not.toHaveBeenCalled();
    });

    it("returns 400 when endDate is before startDate", async () => {
      await rentalsController.createAgreement(
        { body: { ...validBody, startDate: "2026-12-31", endDate: "2026-01-01" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 for a negative monthlyRent", async () => {
      await rentalsController.createAgreement({ body: { ...validBody, monthlyRent: -1 } }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 404 when the stall does not exist", async () => {
      stallModel.exists.mockResolvedValue(false);

      await rentalsController.createAgreement({ body: validBody }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(rentalModel.create).not.toHaveBeenCalled();
    });
  });

  describe("getAgreementsForStall", () => {
    it("returns the rental history for a stall", async () => {
      rentalModel.findByStallId.mockResolvedValue([{ AgreementID: 1 }]);

      await rentalsController.getAgreementsForStall({ params: { id: "1" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, count: 1, data: [{ AgreementID: 1 }] });
    });
  });

  describe("updateAgreement", () => {
    const existing = { AgreementID: 1, EndDate: "2026-12-31", MonthlyRent: 1200, Status: "Active" };

    it("updates when the agreement exists and status is valid", async () => {
      rentalModel.findById.mockResolvedValue(existing);
      rentalModel.update.mockResolvedValue({ ...existing, Status: "Terminated" });

      await rentalsController.updateAgreement({ params: { id: "1" }, body: { status: "Terminated" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 for an invalid status", async () => {
      await rentalsController.updateAgreement({ params: { id: "1" }, body: { status: "Cancelled" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(rentalModel.findById).not.toHaveBeenCalled();
    });

    it("returns 404 when the agreement does not exist", async () => {
      rentalModel.findById.mockResolvedValue(null);

      await rentalsController.updateAgreement({ params: { id: "999" }, body: {} }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("deleteAgreement", () => {
    it("deletes when the agreement exists", async () => {
      rentalModel.findById.mockResolvedValue({ AgreementID: 1 });

      await rentalsController.deleteAgreement({ params: { id: "1" } }, res, next);

      expect(rentalModel.remove).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 when the agreement does not exist", async () => {
      rentalModel.findById.mockResolvedValue(null);

      await rentalsController.deleteAgreement({ params: { id: "999" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(rentalModel.remove).not.toHaveBeenCalled();
    });
  });
});
