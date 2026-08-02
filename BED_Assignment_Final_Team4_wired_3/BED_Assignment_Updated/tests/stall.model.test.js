/*
Owner: Kyra
Unit tests for models/stall.model.js  (MODEL layer)
Same strategy as tests/user.model.test.js: mock dbConfig, assert on the
actual SQL text sent and the parameters bound to it.
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
const stallModel = require("../models/stall.model");

describe("stall.model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("joins Users for OwnerName and computes AverageRating from Feedback", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ StallID: 1 }] });

      const result = await stallModel.findAll();

      expect(result).toEqual([{ StallID: 1 }]);
      const sqlSent = __mockQuery.mock.calls[0][0];
      expect(sqlSent).toContain("JOIN Users u ON u.UserID = s.OwnerID");
      expect(sqlSent).toContain("AverageRating");
    });
  });

  describe("findById", () => {
    it("binds stallId and returns the first row", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ StallID: 1, StallName: "Ah Hock" }] });

      const result = await stallModel.findById(1);

      expect(result).toEqual({ StallID: 1, StallName: "Ah Hock" });
      expect(__mockRequest.input).toHaveBeenCalledWith("stallId", "Int", 1);
    });

    it("returns null when no stall matches", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await stallModel.findById(999)).toBeNull();
    });
  });

  describe("findMenuByStallId", () => {
    it("aggregates cuisine names via STRING_AGG and includes a like count subquery", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ ItemID: 10, Cuisines: "Chinese, Halal", LikeCount: 3 }] });

      const result = await stallModel.findMenuByStallId(1);

      expect(result).toEqual([{ ItemID: 10, Cuisines: "Chinese, Halal", LikeCount: 3 }]);
      expect(__mockRequest.input).toHaveBeenCalledWith("stallId", "Int", 1);
      const sqlSent = __mockQuery.mock.calls[0][0];
      expect(sqlSent).toContain("STRING_AGG(c.Name, ', ') AS Cuisines");
      expect(sqlSent).toContain("LikeCount");
      expect(sqlSent).toContain("ORDER BY mi.Category, mi.ItemName");
    });

    it("returns an empty array for a stall with no menu items yet", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await stallModel.findMenuByStallId(1)).toEqual([]);
    });
  });

  describe("exists", () => {
    it("returns true when a row is found", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ StallID: 1 }] });

      expect(await stallModel.exists(1)).toBe(true);
    });

    it("returns false when no row is found", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await stallModel.exists(999)).toBe(false);
    });
  });

  describe("isOwnedBy", () => {
    it("binds both stallId and ownerId, filtering on OwnerID", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ StallID: 1 }] });

      const result = await stallModel.isOwnedBy(1, 3);

      expect(result).toBe(true);
      expect(__mockRequest.input).toHaveBeenCalledWith("stallId", "Int", 1);
      expect(__mockRequest.input).toHaveBeenCalledWith("ownerId", "Int", 3);
      expect(__mockQuery.mock.calls[0][0]).toContain("OwnerID = @ownerId");
    });

    it("returns false for a non-owner", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await stallModel.isOwnedBy(1, 99)).toBe(false);
    });
  });

  describe("centreExists", () => {
    it("queries HawkerCentres, not Stalls", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ CentreID: 1 }] });

      const result = await stallModel.centreExists(1);

      expect(result).toBe(true);
      expect(__mockQuery.mock.calls[0][0]).toContain("HawkerCentres");
    });
  });

  describe("isVendor", () => {
    it("filters Users by Role = 'Vendor'", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ UserID: 3 }] });

      const result = await stallModel.isVendor(3);

      expect(result).toBe(true);
      expect(__mockQuery.mock.calls[0][0]).toContain("Role = 'Vendor'");
    });

    it("returns false for a non-Vendor user", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await stallModel.isVendor(6)).toBe(false);
    });
  });

  describe("findRaw", () => {
    it("selects all columns, including OwnerID and CentreID unlike findById", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ StallID: 1, OwnerID: 3, CentreID: 1 }] });

      const result = await stallModel.findRaw(1);

      expect(result).toEqual({ StallID: 1, OwnerID: 3, CentreID: 1 });
      expect(__mockRequest.input).toHaveBeenCalledWith("id", "Int", 1);
      expect(__mockQuery.mock.calls[0][0]).toBe("SELECT * FROM Stalls WHERE StallID = @id");
    });

    it("returns null when the stall does not exist", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await stallModel.findRaw(999)).toBeNull();
    });
  });

  describe("create", () => {
    it("binds all five columns and returns the inserted row", async () => {
      const inserted = { StallID: 4, CentreID: 1, OwnerID: 3, StallName: "New Stall" };
      __mockQuery.mockResolvedValue({ recordset: [inserted] });

      const result = await stallModel.create({ centreId: 1, ownerId: 3, stallName: "New Stall", description: null, imageUrl: null });

      expect(result).toEqual(inserted);
      expect(__mockRequest.input).toHaveBeenCalledWith("centreId", "Int", 1);
      expect(__mockRequest.input).toHaveBeenCalledWith("ownerId", "Int", 3);
      expect(__mockRequest.input).toHaveBeenCalledWith("stallName", "VarChar", "New Stall");
      expect(__mockRequest.input).toHaveBeenCalledTimes(5);
    });

    it("coerces a missing description/imageUrl to null rather than binding undefined", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ StallID: 4 }] });

      await stallModel.create({ centreId: 1, ownerId: 3, stallName: "New Stall" });

      expect(__mockRequest.input).toHaveBeenCalledWith("description", "VarChar", null);
      expect(__mockRequest.input).toHaveBeenCalledWith("imageUrl", "VarChar", null);
    });
  });

  describe("update", () => {
    it("updates only StallName, Description and ImageURL - never OwnerID or CentreID", async () => {
      __mockQuery.mockResolvedValue({ recordset: [{ StallID: 1, StallName: "Renamed" }] });

      await stallModel.update(1, { stallName: "Renamed", description: "d", imageUrl: null });

      const sqlSent = __mockQuery.mock.calls[0][0];
      expect(sqlSent).toContain("SET StallName = @stallName, Description = @description, ImageURL = @imageUrl");
      expect(sqlSent).not.toContain("OwnerID =");
      expect(sqlSent).not.toContain("CentreID =");
    });

    it("returns null when the stall does not exist", async () => {
      __mockQuery.mockResolvedValue({ recordset: [] });

      expect(await stallModel.update(999, {})).toBeNull();
    });
  });

  describe("remove", () => {
    it("performs a hard DELETE (no manual dependency pre-checks - the FK constraint does that job)", async () => {
      __mockQuery.mockResolvedValue({});

      await stallModel.remove(1);

      expect(__mockQuery.mock.calls[0][0]).toContain("DELETE FROM Stalls WHERE StallID = @id");
      expect(__mockRequest.input).toHaveBeenCalledWith("id", "Int", 1);
    });

    it("propagates an FK violation (error 547) so errorHandler can map it to 409", async () => {
      const fkErr = Object.assign(new Error("REFERENCE constraint"), { number: 547 });
      __mockQuery.mockRejectedValue(fkErr);

      await expect(stallModel.remove(1)).rejects.toThrow("REFERENCE constraint");
    });
  });
});
