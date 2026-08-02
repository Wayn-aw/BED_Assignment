/*
Owner: Jeremiah
Unit tests for controllers/inspections.controller.js
*/

jest.mock("../dbConfig", () => ({
  sql: { VarChar: "VarChar", Int: "Int" },
  poolPromise: Promise.resolve({}),
}));
jest.mock("../models/inspection.model");
jest.mock("../models/stall.model");

const inspectionModel = require("../models/inspection.model");
const stallModel = require("../models/stall.model");
const inspectionsController = require("../controllers/inspections.controller");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("inspections.controller", () => {
  let res, next;
  const officer = { userId: 1, role: "NEAOfficer" };

  beforeEach(() => {
    res = mockRes();
    next = jest.fn();
  });

  describe("createInspection", () => {
    it("returns 201 and includes the derived grade in the message", async () => {
      stallModel.exists.mockResolvedValue(true);
      inspectionModel.createWithGrade.mockResolvedValue({ InspectionID: 1, Score: 90, grade: { Grade: "A" } });

      await inspectionsController.createInspection(
        { body: { stallId: 1, score: 90, remarks: "Clean" }, user: officer },
        res,
        next
      );

      expect(inspectionModel.createWithGrade).toHaveBeenCalledWith({ stallId: 1, officerId: 1, score: 90, remarks: "Clean" });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("returns 400 when stallId or score is missing", async () => {
      await inspectionsController.createInspection({ body: { stallId: 1 }, user: officer }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it.each([-1, 101])("returns 400 for an out-of-range score of %i", async (score) => {
      await inspectionsController.createInspection({ body: { stallId: 1, score }, user: officer }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 404 when the stall does not exist", async () => {
      stallModel.exists.mockResolvedValue(false);

      await inspectionsController.createInspection({ body: { stallId: 999, score: 80 }, user: officer }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(inspectionModel.createWithGrade).not.toHaveBeenCalled();
    });
  });

  describe("getInspectionHistory", () => {
    it("returns the inspection + grade history for a stall", async () => {
      inspectionModel.findHistoryByStallId.mockResolvedValue([{ InspectionID: 1 }]);

      await inspectionsController.getInspectionHistory({ params: { id: "1" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("updateInspection", () => {
    const existing = { InspectionID: 1, OfficerID: 1, Score: 80, Remarks: "ok" };

    it("allows the recording officer to amend their own inspection", async () => {
      inspectionModel.findById.mockResolvedValue(existing);
      inspectionModel.update.mockResolvedValue({ ...existing, Score: 95 });

      await inspectionsController.updateInspection({ params: { id: "1" }, body: { score: 95 }, user: officer }, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 403 when a different officer tries to amend it", async () => {
      inspectionModel.findById.mockResolvedValue(existing);

      await inspectionsController.updateInspection(
        { params: { id: "1" }, body: { score: 95 }, user: { userId: 99, role: "NEAOfficer" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(inspectionModel.update).not.toHaveBeenCalled();
    });

    it("returns 404 when the inspection does not exist", async () => {
      inspectionModel.findById.mockResolvedValue(null);

      await inspectionsController.updateInspection({ params: { id: "999" }, body: {}, user: officer }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 400 for an out-of-range score on update", async () => {
      await inspectionsController.updateInspection(
        { params: { id: "1" }, body: { score: 150 }, user: officer },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(inspectionModel.findById).not.toHaveBeenCalled();
    });
  });

  describe("deleteInspection", () => {
    const existing = { InspectionID: 1, OfficerID: 1 };

    it("allows the recording officer to delete their own inspection", async () => {
      inspectionModel.findById.mockResolvedValue(existing);

      await inspectionsController.deleteInspection({ params: { id: "1" }, user: officer }, res, next);

      expect(inspectionModel.remove).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 403 when a different officer tries to delete it", async () => {
      inspectionModel.findById.mockResolvedValue(existing);

      await inspectionsController.deleteInspection(
        { params: { id: "1" }, user: { userId: 99, role: "NEAOfficer" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(inspectionModel.remove).not.toHaveBeenCalled();
    });

    it("returns 404 when the inspection does not exist", async () => {
      inspectionModel.findById.mockResolvedValue(null);

      await inspectionsController.deleteInspection({ params: { id: "999" }, user: officer }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
