/*
Owner: Team
Unit tests for middlewares/errorHandler.js
*/

const { errorHandler, asyncHandler } = require("../middlewares/errorHandler");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = () => ({ method: "GET", originalUrl: "/api/v1/test" });

describe("errorHandler", () => {
  let res, next, consoleSpy;

  beforeEach(() => {
    res = mockRes();
    next = jest.fn();
    // errorHandler logs every error - keep test output clean and let us
    // assert it actually logged something without polluting the console.
    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("maps MSSQL error 2627 (unique constraint) to 409 with a generic duplicate message", () => {
    const err = Object.assign(new Error("Violation of UNIQUE KEY constraint"), { number: 2627 });

    errorHandler(err, mockReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Duplicate entry. This record already exists." });
  });

  it("maps MSSQL error 2601 (duplicate index) to 409 the same way as 2627", () => {
    const err = Object.assign(new Error("Cannot insert duplicate key row"), { number: 2601 });

    errorHandler(err, mockReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("maps MSSQL error 547 (FK/reference constraint) to 409 with a referenced-record message", () => {
    const err = Object.assign(new Error("REFERENCE constraint conflict"), { number: 547 });

    errorHandler(err, mockReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "This record cannot be modified/deleted because it is referenced by other records (e.g. existing orders).",
    });
  });

  it("uses a controller-supplied statusCode and message when present (e.g. validation errors thrown from a model)", () => {
    const err = Object.assign(new Error("endDate must be after startDate."), { statusCode: 400 });

    errorHandler(err, mockReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "endDate must be after startDate." });
  });

  it("defaults to 500 with a generic message for an unrecognised error, never leaking the raw error text", () => {
    const err = new Error("ECONNRESET: something internal and sensitive");

    errorHandler(err, mockReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.success).toBe(false);
    expect(jsonArg.message).not.toContain("ECONNRESET");
    expect(jsonArg.message).not.toContain("sensitive");
  });

  it("logs every error it handles", () => {
    errorHandler(new Error("boom"), mockReq(), res, next);

    expect(consoleSpy).toHaveBeenCalled();
  });
});

describe("asyncHandler", () => {
  it("calls the wrapped function and does not touch next() when it resolves", async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(handler);
    const req = {}, res = {}, next = jest.fn();

    await wrapped(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards a thrown/rejected error to next() instead of crashing the process", async () => {
    const boom = new Error("db exploded");
    const handler = jest.fn().mockRejectedValue(boom);
    const wrapped = asyncHandler(handler);
    const next = jest.fn();

    await wrapped({}, {}, next);

    expect(next).toHaveBeenCalledWith(boom);
  });
});
