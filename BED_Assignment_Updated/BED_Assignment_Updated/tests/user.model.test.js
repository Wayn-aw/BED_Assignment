/*
Owner: Kenneth
Unit tests for models/user.model.js  (MODEL layer)

Strategy
--------
A model's only job is: build the right SQL request and return the right slice
of the recordset. We must NOT hit a real SQL Server in a unit test, so we mock
../dbConfig entirely. That lets us assert:
  1. the correct parameters were bound (.input calls)
  2. the correct SQL was sent (.query call)
  3. the return value is shaped correctly (recordset[0] vs null)
*/

// Mock the DB layer BEFORE requiring the model under test.
jest.mock("../dbConfig", () => {
  // Chainable fake of pool.request().input().input().query()
  const mockQuery = jest.fn();
  const mockRequest = {
    input: jest.fn(function () {
      return this; // allow .input().input().input()
    }),
    query: mockQuery,
  };

  return {
    sql: { VarChar: "VarChar", Int: "Int", Decimal: () => "Decimal" },
    poolPromise: Promise.resolve({ request: () => mockRequest }),
    __mockRequest: mockRequest,
    __mockQuery: mockQuery,
  };
});

const { __mockRequest, __mockQuery } = require("../dbConfig");
const userModel = require("../models/user.model");

describe("user.model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- findByEmail ----------
  describe("findByEmail", () => {
    it("returns the user when a matching active account exists", async () => {
      const fakeUser = { UserID: 1, Email: "kenneth@np.edu.sg", Role: "Patron" };
      __mockQuery.mockResolvedValue({ recordset: [fakeUser] });

      const result = await userModel.findByEmail("kenneth@np.edu.sg");

      expect(result).toEqual(fakeUser);
      expect(__mockRequest.input).toHaveBeenCalledWith("email", "VarChar", "kenneth@np.edu.sg");
      // Guard against accidentally dropping the IsActive filter (soft-delete bug)
      expect(__mockQuery.mock.calls[0][0]).toContain("IsActive = 1");
    });

    it("returns null when no row is found", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      const result = await userModel.findByEmail("nobody@np.edu.sg");

      expect(result).toBeNull();
    });
  });

  // ---------- findById ----------
  describe("findById", () => {
    it("never selects the PasswordHash column", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ UserID: 7, Name: "Kyra" }] });

      await userModel.findById(7);

      expect(__mockQuery.mock.calls[0][0]).not.toContain("PasswordHash");
      expect(__mockRequest.input).toHaveBeenCalledWith("userId", "Int", 7);
    });
  });

  // ---------- create ----------
  describe("create", () => {
    it("binds all five columns and returns the inserted row", async () => {
      const inserted = { UserID: 42, Name: "Wayne", Email: "wayne@np.edu.sg", Role: "Vendor" };
      __mockQuery.mockResolvedValue({ recordset: [inserted] });

      const result = await userModel.create({
        name: "Wayne",
        email: "wayne@np.edu.sg",
        passwordHash: "$2a$10$hashedvalue",
        role: "Vendor",
        phone: "91234567",
      });

      expect(result).toEqual(inserted);
      expect(__mockRequest.input).toHaveBeenCalledWith("name", "VarChar", "Wayne");
      expect(__mockRequest.input).toHaveBeenCalledWith("hash", "VarChar", "$2a$10$hashedvalue");
      expect(__mockRequest.input).toHaveBeenCalledWith("role", "VarChar", "Vendor");
      expect(__mockRequest.input).toHaveBeenCalledTimes(5);
    });

    it("propagates a duplicate-key error so the errorHandler can map it to 409", async () => {
      const dupErr = Object.assign(new Error("Violation of UNIQUE KEY"), { number: 2627 });
      __mockQuery.mockRejectedValue(dupErr);

      await expect(
        userModel.create({ name: "A", email: "dup@np.edu.sg", passwordHash: "h", role: "Patron", phone: null })
      ).rejects.toThrow("Violation of UNIQUE KEY");
    });
  });

  // ---------- updateProfile ----------
  describe("updateProfile", () => {
    it("returns the updated row", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ UserID: 3, Name: "New Name", Phone: "80001111" }] });

      const result = await userModel.updateProfile(3, { name: "New Name", phone: "80001111" });

      expect(result.Name).toBe("New Name");
    });

    it("coerces an undefined phone to null rather than binding undefined", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ UserID: 3 }] });

      await userModel.updateProfile(3, { name: "New Name" });

      expect(__mockRequest.input).toHaveBeenCalledWith("phone", "VarChar", null);
    });

    it("returns null when the UserID does not exist", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      const result = await userModel.updateProfile(999, { name: "Ghost" });

      expect(result).toBeNull();
    });
  });

  // ---------- deactivate ----------
  describe("deactivate", () => {
    it("performs a SOFT delete (UPDATE IsActive = 0), never a hard DELETE", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ UserID: 5, IsActive: false }] });

      const result = await userModel.deactivate(5);

      const sqlSent = __mockQuery.mock.calls[0][0];
      expect(sqlSent).toContain("IsActive = 0");
      expect(sqlSent).not.toMatch(/DELETE\s+FROM/i);
      expect(result.IsActive).toBe(false);
    });

    it("returns null when the user does not exist", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await userModel.deactivate(12345)).toBeNull();
    });
  });
});
