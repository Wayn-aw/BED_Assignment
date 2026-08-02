/*
Owner: Kyra
Unit tests for models/complaint.model.js  (MODEL layer)
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
    sql: { VarChar: "VarChar", Int: "Int" },
    poolPromise: Promise.resolve({ request: () => mockRequest }),
    __mockRequest: mockRequest,
    __mockQuery: mockQuery,
  };
});

const { __mockRequest, __mockQuery } = require("../dbConfig");
const complaintModel = require("../models/complaint.model");

describe("complaint.model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("binds patronId, stallId and description", async () => {
      const inserted = { ComplaintID: 1 };
      __mockQuery.mockResolvedValue({ recordset: [inserted] });

      const result = await complaintModel.create({ patronId: 6, stallId: 1, description: "Queue was too long." });

      expect(result).toEqual(inserted);
      expect(__mockRequest.input).toHaveBeenCalledWith("patronId", "Int", 6);
      expect(__mockRequest.input).toHaveBeenCalledWith("desc", "VarChar", "Queue was too long.");
    });
  });

  describe("findByPatronId", () => {
    it("joins Stalls for the stall name and scopes strictly to the given patron", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ ComplaintID: 1, StallName: "Ah Hock" }] });

      const result = await complaintModel.findByPatronId(6);

      expect(result).toEqual([{ ComplaintID: 1, StallName: "Ah Hock" }]);
      expect(__mockRequest.input).toHaveBeenCalledWith("patronId", "Int", 6);
      const sqlSent = __mockQuery.mock.calls[0][0];
      expect(sqlSent).toContain("JOIN Stalls s ON s.StallID = c.StallID");
      expect(sqlSent).toContain("WHERE c.PatronID = @patronId");
    });
  });

  describe("updateStatus", () => {
    it("updates the Status column and returns the inserted row via OUTPUT", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ ComplaintID: 1, Status: "Resolved" }] });

      const result = await complaintModel.updateStatus(1, "Resolved");

      expect(result).toEqual({ ComplaintID: 1, Status: "Resolved" });
      expect(__mockRequest.input).toHaveBeenCalledWith("status", "VarChar", "Resolved");
      expect(__mockQuery.mock.calls[0][0]).toContain("SET Status = @status");
    });

    it("returns null when the complaint does not exist", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await complaintModel.updateStatus(999, "Resolved")).toBeNull();
    });
  });
});
