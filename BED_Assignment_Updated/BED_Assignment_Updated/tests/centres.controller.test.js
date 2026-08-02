/*
Owner: <YOUR NAME>
Unit tests for controllers/centres.controller.js

The service is mocked here -- we are testing validation and response shaping
only, not the upstream integration (that is covered in dataGovSg.service.test.js).
*/

jest.mock("../services/dataGovSg.service");

const dataGovSg = require("../services/dataGovSg.service");
const centresController = require("../controllers/centres.controller");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("centres.controller", () => {
  let res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockRes();
    next = jest.fn();
  });

  describe("getNeaHawkerCentres", () => {
    it("returns 200 with the records and a source attribution", async () => {
      dataGovSg.fetchHawkerCentres.mockResolvedValue({
        records: [{ name: "Maxwell Food Centre" }],
        total: 1,
        cached: false,
      });

      await centresController.getNeaHawkerCentres({ query: {} }, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          source: expect.stringContaining("data.gov.sg"),
          count: 1,
          total: 1,
          data: [{ name: "Maxwell Food Centre" }],
        })
      );
    });

    it("applies sensible defaults when no query string is supplied", async () => {
      dataGovSg.fetchHawkerCentres.mockResolvedValue({ records: [], total: 0, cached: false });

      await centresController.getNeaHawkerCentres({ query: {} }, res, next);

      expect(dataGovSg.fetchHawkerCentres).toHaveBeenCalledWith({ limit: 20, offset: 0, search: "" });
    });

    it("passes a trimmed search term through to the service", async () => {
      dataGovSg.fetchHawkerCentres.mockResolvedValue({ records: [], total: 0, cached: false });

      await centresController.getNeaHawkerCentres({ query: { search: "  Bedok  " } }, res, next);

      expect(dataGovSg.fetchHawkerCentres).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Bedok" })
      );
    });

    it("surfaces the cached flag so the demo can show a cache hit", async () => {
      dataGovSg.fetchHawkerCentres.mockResolvedValue({ records: [], total: 0, cached: true });

      await centresController.getNeaHawkerCentres({ query: {} }, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ cached: true }));
    });

    // --- validation: every one of these must fail BEFORE we call out ---
    it.each([
      ["zero", "0"],
      ["negative", "-5"],
      ["above the maximum", "101"],
      ["not a number", "abc"],
      ["a decimal", "2.5"],
    ])("returns 400 for a limit that is %s", async (_label, limit) => {
      await centresController.getNeaHawkerCentres({ query: { limit } }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(dataGovSg.fetchHawkerCentres).not.toHaveBeenCalled();
    });

    it.each([
      ["negative", "-1"],
      ["not a number", "xyz"],
    ])("returns 400 for an offset that is %s", async (_label, offset) => {
      await centresController.getNeaHawkerCentres({ query: { offset } }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(dataGovSg.fetchHawkerCentres).not.toHaveBeenCalled();
    });

    it("accepts the boundary values limit=1 and limit=100", async () => {
      dataGovSg.fetchHawkerCentres.mockResolvedValue({ records: [], total: 0, cached: false });

      await centresController.getNeaHawkerCentres({ query: { limit: "1" } }, res, next);
      await centresController.getNeaHawkerCentres({ query: { limit: "100" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.status).not.toHaveBeenCalledWith(400);
    });

    it("returns 400 when search is repeated and arrives as an array", async () => {
      // Express parses ?search=a&search=b into an array - a classic crash source.
      await centresController.getNeaHawkerCentres({ query: { search: ["a", "b"] } }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(dataGovSg.fetchHawkerCentres).not.toHaveBeenCalled();
    });

    it("forwards upstream errors to next() with their statusCode intact", async () => {
      const rateLimited = Object.assign(new Error("rate limit"), { statusCode: 429 });
      dataGovSg.fetchHawkerCentres.mockRejectedValue(rateLimited);

      await centresController.getNeaHawkerCentres({ query: {} }, res, next);

      expect(next).toHaveBeenCalledWith(rateLimited);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
