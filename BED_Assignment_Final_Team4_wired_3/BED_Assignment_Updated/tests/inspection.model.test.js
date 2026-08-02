/*
Owner: Jeremiah
Unit tests for models/inspection.model.js  (MODEL layer)

createWithGrade() runs in a real SQL transaction (like order.model's
checkout()), so it uses the same queued-response mock strategy.
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

  const mockQuery = jest.fn();
  const mockRequest = {
    input: jest.fn(function () {
      return this;
    }),
    query: mockQuery,
  };

  return {
    sql: { Int: "Int", VarChar: "VarChar", Char: () => "Char", Transaction: TransactionMock, Request: RequestMock },
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
const inspectionModel = require("../models/inspection.model");

describe("inspection.model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dbConfig.__setQueryResponses([]);
  });

  describe("createWithGrade", () => {
    it.each([
      [95, "A"],
      [80, "B"],
      [65, "C"],
      [40, "D"],
    ])("derives grade %s -> %s from the score and commits", async (score, expectedGrade) => {
      dbConfig.__setQueryResponses([
        { recordset: [{ InspectionID: 1, Score: score }] }, // INSERT Inspections
        {}, // close out previous HygieneGrades row
        { recordset: [{ Grade: expectedGrade }] }, // INSERT HygieneGrades
      ]);

      const result = await inspectionModel.createWithGrade({ stallId: 1, officerId: 1, score, remarks: "ok" });

      expect(result.grade.Grade).toBe(expectedGrade);
      expect(dbConfig.__getLastTransaction().commit).toHaveBeenCalled();
    });

    it("closes out the previous current grade (ValidTo = today) before inserting the new one", async () => {
      dbConfig.__setQueryResponses([
        { recordset: [{ InspectionID: 1, Score: 90 }] },
        {},
        { recordset: [{ Grade: "A" }] },
      ]);

      await inspectionModel.createWithGrade({ stallId: 1, officerId: 1, score: 90, remarks: null });

      // Three sql.Request instances are constructed in order: insert inspection,
      // close out the previous grade, insert the new grade. Check the SQL text
      // sent by the second one specifically.
      const requestInstances = dbConfig.sql.Request.mock.results.map((r) => r.value);
      const closeOutSql = requestInstances[1].query.mock.calls[0][0];
      expect(closeOutSql).toContain("UPDATE HygieneGrades SET ValidTo = GETDATE()");
      expect(closeOutSql).toContain("ValidTo IS NULL");
    });

    it("rolls back and re-throws when the transaction fails partway through", async () => {
      const dbErr = new Error("deadlock");
      dbConfig.__setQueryResponses([{ recordset: [{ InspectionID: 1, Score: 90 }] }, dbErr]);

      await expect(
        inspectionModel.createWithGrade({ stallId: 1, officerId: 1, score: 90, remarks: null })
      ).rejects.toThrow("deadlock");

      expect(dbConfig.__getLastTransaction().rollback).toHaveBeenCalled();
      expect(dbConfig.__getLastTransaction().commit).not.toHaveBeenCalled();
    });
  });

  describe("findHistoryByStallId", () => {
    it("left-joins HygieneGrades so an inspection without a grade row still appears", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ InspectionID: 1, Grade: null }] });

      const result = await inspectionModel.findHistoryByStallId(1);

      expect(result).toEqual([{ InspectionID: 1, Grade: null }]);
      expect(__mockQuery.mock.calls[0][0]).toContain("LEFT JOIN HygieneGrades");
    });
  });

  describe("findById", () => {
    it("returns null when the inspection does not exist", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await inspectionModel.findById(999)).toBeNull();
    });
  });

  describe("update", () => {
    it("updates Score and Remarks only", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ InspectionID: 1, Score: 95 }] });

      await inspectionModel.update(1, { score: 95, remarks: "Improved" });

      expect(__mockQuery.mock.calls[0][0]).toContain("SET Score = @score, Remarks = @remarks");
    });
  });

  describe("remove", () => {
    it("deletes by InspectionID", async () => {
      __mockQuery.mockResolvedValue({});

      await inspectionModel.remove(1);

      expect(__mockQuery.mock.calls[0][0]).toContain("DELETE FROM Inspections WHERE InspectionID = @id");
    });
  });
});
