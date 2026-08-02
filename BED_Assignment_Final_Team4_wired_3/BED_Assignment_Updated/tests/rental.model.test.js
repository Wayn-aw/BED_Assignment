/*
Owner: Yongsheng
Unit tests for models/rental.model.js  (MODEL layer)
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
    sql: { VarChar: "VarChar", Int: "Int", Date: "Date", Decimal: () => "Decimal" },
    poolPromise: Promise.resolve({ request: () => mockRequest }),
    __mockRequest: mockRequest,
    __mockQuery: mockQuery,
  };
});

const { __mockRequest, __mockQuery } = require("../dbConfig");
const rentalModel = require("../models/rental.model");

describe("rental.model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("binds all four columns and returns the inserted row", async () => {
      const inserted = { AgreementID: 1 };
      __mockQuery.mockResolvedValue({ recordset: [inserted] });

      const result = await rentalModel.create({ stallId: 1, startDate: "2026-01-01", endDate: "2026-12-31", monthlyRent: 1200 });

      expect(result).toEqual(inserted);
      expect(__mockRequest.input).toHaveBeenCalledWith("rent", "Decimal", 1200);
    });
  });

  describe("findByStallId", () => {
    it("orders by StartDate descending so renewals show newest first", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ AgreementID: 2 }, { AgreementID: 1 }] });

      const result = await rentalModel.findByStallId(1);

      expect(result).toHaveLength(2);
      expect(__mockQuery.mock.calls[0][0]).toContain("ORDER BY StartDate DESC");
    });
  });

  describe("findById", () => {
    it("returns null when the agreement does not exist", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await rentalModel.findById(999)).toBeNull();
    });
  });

  describe("update", () => {
    it("updates EndDate, MonthlyRent and Status", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ AgreementID: 1, Status: "Terminated" }] });

      await rentalModel.update(1, { endDate: "2026-06-30", monthlyRent: 1300, status: "Terminated" });

      const sqlSent = __mockQuery.mock.calls[0][0];
      expect(sqlSent).toContain("SET EndDate = @endDate, MonthlyRent = @rent, Status = @status");
    });
  });

  describe("remove", () => {
    it("deletes by AgreementID", async () => {
      __mockQuery.mockResolvedValue({});

      await rentalModel.remove(1);

      expect(__mockQuery.mock.calls[0][0]).toContain("DELETE FROM RentalAgreements WHERE AgreementID = @id");
    });
  });
});
