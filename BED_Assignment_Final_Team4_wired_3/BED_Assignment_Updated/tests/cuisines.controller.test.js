/*
Owner: Wayne
Unit tests for controllers/cuisines.controller.js
*/

jest.mock("../dbConfig", () => ({
  sql: { Int: "Int" },
  poolPromise: Promise.resolve({}),
}));
jest.mock("../models/menu.model");

const menuModel = require("../models/menu.model");
const cuisinesController = require("../controllers/cuisines.controller");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("cuisines.controller", () => {
  let res, next;

  beforeEach(() => {
    res = mockRes();
    next = jest.fn();
  });

  describe("getAllCuisines", () => {
    it("returns 200 with the cuisine list", async () => {
      menuModel.listAllCuisines.mockResolvedValue([{ CuisineID: 1, Name: "Chinese" }]);

      await cuisinesController.getAllCuisines({}, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, count: 1, data: [{ CuisineID: 1, Name: "Chinese" }] });
    });

    it("returns an empty array rather than erroring when there are no cuisines seeded", async () => {
      menuModel.listAllCuisines.mockResolvedValue([]);

      await cuisinesController.getAllCuisines({}, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true, count: 0, data: [] });
    });

    it("forwards model errors to next()", async () => {
      const boom = new Error("db down");
      menuModel.listAllCuisines.mockRejectedValue(boom);

      await cuisinesController.getAllCuisines({}, res, next);

      expect(next).toHaveBeenCalledWith(boom);
    });
  });
});
