/*
Owner: <YOUR NAME>
Unit tests for services/dataGovSg.service.js

The whole point of a third-party integration is that the third party WILL
misbehave -- it will be slow, rate-limit you, or return something unexpected.
So we mock global fetch and drive every one of those paths deliberately.
No network access is needed to run these.
*/

describe("dataGovSg.service", () => {
  let service;

  const okResponse = (records = [], total = 0) => ({
    ok: true,
    status: 200,
    json: async () => ({ success: true, result: { records, total } }),
  });

  beforeEach(() => {
    jest.resetModules(); // re-require the service so its cache starts empty
    process.env.DATAGOV_HAWKER_DATASET_ID = "d_testdataset";
    global.fetch = jest.fn();
    service = require("../services/dataGovSg.service");
    service.clearCache();
  });

  afterEach(() => {
    delete global.fetch;
  });

  // ---------- happy path ----------
  describe("successful fetch", () => {
    it("returns the records and total from the upstream payload", async () => {
      global.fetch.mockResolvedValue(okResponse([{ name: "Maxwell Food Centre" }], 1));

      const result = await service.fetchHawkerCentres({ limit: 5 });

      expect(result.records).toEqual([{ name: "Maxwell Food Centre" }]);
      expect(result.total).toBe(1);
      expect(result.cached).toBe(false);
    });

    it("builds the upstream URL with resource_id, limit and offset", async () => {
      global.fetch.mockResolvedValue(okResponse());

      await service.fetchHawkerCentres({ limit: 5, offset: 10 });

      const calledUrl = global.fetch.mock.calls[0][0];
      expect(calledUrl).toContain("https://data.gov.sg/api/action/datastore_search");
      expect(calledUrl).toContain("resource_id=d_testdataset");
      expect(calledUrl).toContain("limit=5");
      expect(calledUrl).toContain("offset=10");
    });

    it("omits the q parameter entirely when no search term is given", async () => {
      global.fetch.mockResolvedValue(okResponse());

      await service.fetchHawkerCentres({});

      expect(global.fetch.mock.calls[0][0]).not.toContain("q=");
    });

    it("URL-encodes a search term so spaces cannot break the query string", async () => {
      global.fetch.mockResolvedValue(okResponse());

      await service.fetchHawkerCentres({ search: "Old Airport Road" });

      const calledUrl = global.fetch.mock.calls[0][0];
      expect(calledUrl).toContain("q=Old+Airport+Road");
      expect(calledUrl).not.toContain("Old Airport Road");
    });

    it("defaults to an empty array when upstream omits records", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, result: { total: 0 } }),
      });

      const result = await service.fetchHawkerCentres({});

      expect(result.records).toEqual([]);
    });
  });

  // ---------- caching ----------
  describe("caching", () => {
    it("serves the second identical call from cache without calling fetch again", async () => {
      global.fetch.mockResolvedValue(okResponse([{ name: "Tekka Centre" }], 1));

      const first = await service.fetchHawkerCentres({ limit: 5 });
      const second = await service.fetchHawkerCentres({ limit: 5 });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(first.cached).toBe(false);
      expect(second.cached).toBe(true);
      expect(second.records).toEqual(first.records);
    });

    it("treats different query parameters as separate cache entries", async () => {
      global.fetch.mockResolvedValue(okResponse());

      await service.fetchHawkerCentres({ limit: 5 });
      await service.fetchHawkerCentres({ limit: 10 });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("does not cache failed responses", async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(service.fetchHawkerCentres({})).rejects.toThrow();

      global.fetch.mockResolvedValueOnce(okResponse([{ name: "Chomp Chomp" }], 1));
      const result = await service.fetchHawkerCentres({});

      expect(result.records).toEqual([{ name: "Chomp Chomp" }]);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("clearCache forces the next call back to the network", async () => {
      global.fetch.mockResolvedValue(okResponse());

      await service.fetchHawkerCentres({});
      service.clearCache();
      await service.fetchHawkerCentres({});

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  // ---------- failure paths ----------
  describe("upstream failures", () => {
    it("maps a 429 to statusCode 429 with a retry-friendly message", async () => {
      global.fetch.mockResolvedValue({ ok: false, status: 429 });

      await expect(service.fetchHawkerCentres({})).rejects.toMatchObject({
        statusCode: 429,
        message: expect.stringContaining("rate limit"),
      });
    });

    it("maps any other non-OK status to 502 Bad Gateway", async () => {
      global.fetch.mockResolvedValue({ ok: false, status: 500 });

      await expect(service.fetchHawkerCentres({})).rejects.toMatchObject({ statusCode: 502 });
    });

    it("maps a network failure to 503 without leaking the raw error", async () => {
      global.fetch.mockRejectedValue(new Error("ENOTFOUND data.gov.sg"));

      const err = await service.fetchHawkerCentres({}).catch((e) => e);

      expect(err.statusCode).toBe(503);
      expect(err.message).not.toContain("ENOTFOUND");
    });

    it("maps an aborted (timed out) request to 503 with a timeout message", async () => {
      const abortErr = new Error("The operation was aborted");
      abortErr.name = "AbortError";
      global.fetch.mockRejectedValue(abortErr);

      await expect(service.fetchHawkerCentres({})).rejects.toMatchObject({
        statusCode: 503,
        message: expect.stringContaining("too long"),
      });
    });

    it("rejects with 502 when upstream returns 200 but success is false", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: false, error: { message: "Not found" } }),
      });

      await expect(service.fetchHawkerCentres({})).rejects.toMatchObject({ statusCode: 502 });
    });

    it("rejects with 502 when the payload is missing the result object", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      await expect(service.fetchHawkerCentres({})).rejects.toMatchObject({ statusCode: 502 });
    });

    it("rejects with 500 when the dataset ID is not configured", async () => {
      jest.resetModules();
      delete process.env.DATAGOV_HAWKER_DATASET_ID;
      const unconfigured = require("../services/dataGovSg.service");

      await expect(unconfigured.fetchHawkerCentres({})).rejects.toMatchObject({
        statusCode: 500,
        message: expect.stringContaining("DATAGOV_HAWKER_DATASET_ID"),
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  // ---------- timeout wiring ----------
  describe("timeout handling", () => {
    it("passes an AbortSignal so a slow upstream cannot hang the request", async () => {
      global.fetch.mockResolvedValue(okResponse());

      await service.fetchHawkerCentres({});

      expect(global.fetch.mock.calls[0][1].signal).toBeDefined();
    });
  });
});
