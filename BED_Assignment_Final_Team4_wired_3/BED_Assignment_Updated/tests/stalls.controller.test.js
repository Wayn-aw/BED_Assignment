/*
Owner: Kyra
Unit tests for controllers/stalls.controller.js
*/

jest.mock("../dbConfig", () => ({
  sql: { VarChar: "VarChar", Int: "Int" },
  poolPromise: Promise.resolve({}),
}));
jest.mock("../models/stall.model");

const stallModel = require("../models/stall.model");
const stallsController = require("../controllers/stalls.controller");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("stalls.controller", () => {
  let res, next;

  beforeEach(() => {
    res = mockRes();
    next = jest.fn();
  });

  describe("getAllStalls", () => {
    it("returns 200 with the stall list", async () => {
      stallModel.findAll.mockResolvedValue([{ StallID: 1, StallName: "Ah Hock's Chicken Rice" }]);

      await stallsController.getAllStalls({}, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, count: 1, data: [{ StallID: 1, StallName: "Ah Hock's Chicken Rice" }] });
    });

    it("forwards model errors to next()", async () => {
      const boom = new Error("db down");
      stallModel.findAll.mockRejectedValue(boom);

      await stallsController.getAllStalls({}, res, next);

      expect(next).toHaveBeenCalledWith(boom);
    });
  });

  describe("getStallById", () => {
    it("merges the stall and its menu into one payload", async () => {
      stallModel.findById.mockResolvedValue({ StallID: 1, StallName: "Ah Hock's Chicken Rice" });
      stallModel.findMenuByStallId.mockResolvedValue([{ ItemID: 10 }]);

      await stallsController.getStallById({ params: { id: "1" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { StallID: 1, StallName: "Ah Hock's Chicken Rice", menu: [{ ItemID: 10 }] },
      });
    });

    it("returns 404 and skips the menu query when the stall does not exist", async () => {
      stallModel.findById.mockResolvedValue(null);

      await stallsController.getStallById({ params: { id: "999" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(stallModel.findMenuByStallId).not.toHaveBeenCalled();
    });
  });

  describe("createStall", () => {
    const body = { centreId: 1, ownerId: 3, stallName: "New Stall" };

    it("returns 201 when centre exists and ownerId is a Vendor", async () => {
      stallModel.centreExists.mockResolvedValue(true);
      stallModel.isVendor.mockResolvedValue(true);
      stallModel.create.mockResolvedValue({ StallID: 4, ...body });

      await stallsController.createStall({ body }, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it.each([
      ["centreId", { ownerId: 3, stallName: "New Stall" }],
      ["ownerId", { centreId: 1, stallName: "New Stall" }],
      ["stallName", { centreId: 1, ownerId: 3 }],
    ])("returns 400 when %s is missing", async (_field, badBody) => {
      await stallsController.createStall({ body: badBody }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(stallModel.create).not.toHaveBeenCalled();
    });

    it("returns 404 when the centre does not exist", async () => {
      stallModel.centreExists.mockResolvedValue(false);

      await stallsController.createStall({ body }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(stallModel.isVendor).not.toHaveBeenCalled();
    });

    it("returns 400 when ownerId does not belong to a Vendor", async () => {
      stallModel.centreExists.mockResolvedValue(true);
      stallModel.isVendor.mockResolvedValue(false);

      await stallsController.createStall({ body }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(stallModel.create).not.toHaveBeenCalled();
    });
  });

  describe("updateStall", () => {
    const existing = { StallID: 1, OwnerID: 3, StallName: "Old Name", Description: "Old", ImageURL: null };

    it("allows the owning Vendor to update their own stall", async () => {
      stallModel.findRaw.mockResolvedValue(existing);
      stallModel.update.mockResolvedValue({ ...existing, StallName: "New Name" });

      await stallsController.updateStall(
        { params: { id: "1" }, body: { stallName: "New Name" }, user: { userId: 3, role: "Vendor" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 403 when a Vendor tries to update a stall they do not own", async () => {
      stallModel.findRaw.mockResolvedValue(existing);

      await stallsController.updateStall(
        { params: { id: "1" }, body: { stallName: "New Name" }, user: { userId: 99, role: "Vendor" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(stallModel.update).not.toHaveBeenCalled();
    });

    it("allows Operator to update any stall regardless of ownership", async () => {
      stallModel.findRaw.mockResolvedValue(existing);
      stallModel.update.mockResolvedValue({ ...existing, StallName: "New Name" });

      await stallsController.updateStall(
        { params: { id: "1" }, body: { stallName: "New Name" }, user: { userId: 99, role: "Operator" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 when the stall does not exist", async () => {
      stallModel.findRaw.mockResolvedValue(null);

      await stallsController.updateStall(
        { params: { id: "999" }, body: {}, user: { userId: 3, role: "Vendor" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("deleteStall", () => {
    it("deletes when the stall exists (route already restricts to Operator/Admin)", async () => {
      stallModel.findRaw.mockResolvedValue({ StallID: 1 });

      await stallsController.deleteStall({ params: { id: "1" } }, res, next);

      expect(stallModel.remove).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 when the stall does not exist", async () => {
      stallModel.findRaw.mockResolvedValue(null);

      await stallsController.deleteStall({ params: { id: "999" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(stallModel.remove).not.toHaveBeenCalled();
    });

    it("forwards a 409 FK-violation style error to next() untouched", async () => {
      stallModel.findRaw.mockResolvedValue({ StallID: 1 });
      const boom = Object.assign(new Error("conflict"), { number: 547 });
      stallModel.remove.mockRejectedValue(boom);

      await stallsController.deleteStall({ params: { id: "1" } }, res, next);

      expect(next).toHaveBeenCalledWith(boom);
    });
  });
});
