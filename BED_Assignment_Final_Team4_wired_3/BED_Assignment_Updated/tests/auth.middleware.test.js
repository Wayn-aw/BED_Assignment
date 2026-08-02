/*
Owner: Kenneth
Unit tests for middlewares/auth.middleware.js
*/

jest.mock("jsonwebtoken");

const jwt = require("jsonwebtoken");
const { verifyToken, requireRole, optionalAuth } = require("../middlewares/auth.middleware");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("auth.middleware", () => {
  const OLD_ENV = process.env;
  let res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, JWT_SECRET: "test-secret" };
    res = mockRes();
    next = jest.fn();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe("verifyToken", () => {
    it("attaches the decoded payload to req.user and calls next() for a valid token", () => {
      const decoded = { userId: 6, role: "Patron", email: "jonathan@example.com" };
      jwt.verify.mockReturnValue(decoded);
      const req = { headers: { authorization: "Bearer valid.token.here" } };

      verifyToken(req, res, next);

      expect(req.user).toEqual(decoded);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("returns 401 when no Authorization header is present at all", () => {
      verifyToken({ headers: {} }, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 401 when the header does not include a token after 'Bearer'", () => {
      verifyToken({ headers: { authorization: "Bearer" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("returns 403 for an expired or otherwise invalid token, not 401", () => {
      jwt.verify.mockImplementation(() => {
        throw new Error("jwt expired");
      });

      verifyToken({ headers: { authorization: "Bearer expired.token" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireRole", () => {
    it("calls next() when req.user.role is in the allowed list", () => {
      const middleware = requireRole("Vendor", "Admin");

      middleware({ user: { role: "Vendor" } }, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("returns 403 when req.user.role is not in the allowed list", () => {
      const middleware = requireRole("Vendor", "Admin");

      middleware({ user: { role: "Patron" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 401 (not 403) when requireRole runs without verifyToken having populated req.user", () => {
      const middleware = requireRole("Vendor");

      middleware({}, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("accepts any one of multiple allowed roles", () => {
      const middleware = requireRole("Operator", "Vendor", "Admin");

      middleware({ user: { role: "Operator" } }, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("optionalAuth", () => {
    it("populates req.user and calls next() when a valid token is present", () => {
      const decoded = { userId: 6, role: "Patron" };
      jwt.verify.mockReturnValue(decoded);
      const req = { headers: { authorization: "Bearer valid.token" } };

      optionalAuth(req, res, next);

      expect(req.user).toEqual(decoded);
      expect(next).toHaveBeenCalled();
    });

    it("calls next() as a guest (no req.user) when no token is present, rather than rejecting", () => {
      const req = { headers: {} };

      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("calls next() as a guest when the token is present but invalid, instead of returning 403", () => {
      jwt.verify.mockImplementation(() => {
        throw new Error("malformed");
      });
      const req = { headers: { authorization: "Bearer garbage" } };

      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
