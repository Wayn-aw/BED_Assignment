/*
Owner: Kyra
Unit tests for controllers/complaints.controller.js
*/

jest.mock("../dbConfig", () => ({
  sql: { VarChar: "VarChar", Int: "Int" },
  poolPromise: Promise.resolve({}),
}));
jest.mock("../models/complaint.model");
jest.mock("../models/stall.model");

const complaintModel = require("../models/complaint.model");
const stallModel = require("../models/stall.model");
const complaintsController = require("../controllers/complaints.controller");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("complaints.controller", () => {
  let res, next;
  const patron = { userId: 6, role: "Patron" };

  beforeEach(() => {
    res = mockRes();
    next = jest.fn();
  });

  describe("createComplaint", () => {
    it("returns 201 for a valid complaint", async () => {
      stallModel.exists.mockResolvedValue(true);
      complaintModel.create.mockResolvedValue({ ComplaintID: 1 });

      await complaintsController.createComplaint(
        { body: { stallId: 1, description: "The queue was extremely long today." }, user: patron },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("returns 400 when stallId or description is missing", async () => {
      await complaintsController.createComplaint({ body: { stallId: 1 }, user: patron }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when description is under 10 characters", async () => {
      await complaintsController.createComplaint(
        { body: { stallId: 1, description: "too short" }, user: patron },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(stallModel.exists).not.toHaveBeenCalled();
    });

    it("returns 404 when the stall does not exist", async () => {
      stallModel.exists.mockResolvedValue(false);

      await complaintsController.createComplaint(
        { body: { stallId: 999, description: "This stall does not exist at all." }, user: patron },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(complaintModel.create).not.toHaveBeenCalled();
    });
  });

  describe("getMyComplaints", () => {
    it("returns only the logged-in patron's complaints", async () => {
      complaintModel.findByPatronId.mockResolvedValue([{ ComplaintID: 1 }]);

      await complaintsController.getMyComplaints({ user: patron }, res, next);

      expect(complaintModel.findByPatronId).toHaveBeenCalledWith(6);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("updateComplaintStatus", () => {
    it.each(["Open", "Investigating", "Resolved", "Dismissed"])(
      "accepts the valid status %s",
      async (status) => {
        complaintModel.updateStatus.mockResolvedValue({ ComplaintID: 1, Status: status });

        await complaintsController.updateComplaintStatus({ params: { id: "1" }, body: { status } }, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
      }
    );

    it("returns 400 for an invalid status", async () => {
      await complaintsController.updateComplaintStatus(
        { params: { id: "1" }, body: { status: "Ignored" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(complaintModel.updateStatus).not.toHaveBeenCalled();
    });

    it("returns 404 when the complaint does not exist", async () => {
      complaintModel.updateStatus.mockResolvedValue(null);

      await complaintsController.updateComplaintStatus(
        { params: { id: "999" }, body: { status: "Resolved" } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
