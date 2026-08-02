/*
Owner: Kenneth
Unit tests for controllers/users.controller.js  (CONTROLLER layer)

Strategy
--------
A controller's job is: validate input -> call the model -> pick the right
status code and JSON shape. So we mock the model, bcrypt and jwt, and assert
purely on res.status / res.json / next(err). No database, no real hashing.
*/

// IMPORTANT: dbConfig must be mocked too. jest.mock("../models/user.model")
// still loads the real model file to work out its shape, and that file
// requires ../dbConfig -- which would otherwise open a live MSSQL connection
// pool the moment the test starts (slow tests + open handles + CI failures).
jest.mock("../dbConfig", () => ({
  sql: { VarChar: "VarChar", Int: "Int" },
  poolPromise: Promise.resolve({}),
}));

jest.mock("../models/user.model");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const usersController = require("../controllers/users.controller");

// --- helpers: fake Express req/res/next -------------------------------
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res); // allow res.status().json()
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("users.controller", () => {
  let res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockRes();
    next = jest.fn();
    process.env.JWT_SECRET = "test-secret";
  });

  // =====================================================================
  // register
  // =====================================================================
  describe("register", () => {
    const validBody = {
      name: "Kenneth",
      email: "kenneth@np.edu.sg",
      password: "Password123!",
      role: "Patron",
      phone: "91234567",
    };

    it("returns 201 and the created user on success", async () => {
      userModel.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed-pw");
      userModel.create.mockResolvedValue({ UserID: 1, Name: "Kenneth", Role: "Patron" });

      await usersController.register({ body: validBody }, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ UserID: 1 }) })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("hashes the password and never stores the plaintext", async () => {
      userModel.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed-pw");
      userModel.create.mockResolvedValue({ UserID: 1 });

      await usersController.register({ body: validBody }, res, next);

      expect(bcrypt.hash).toHaveBeenCalledWith("Password123!", 10);
      const savedPayload = userModel.create.mock.calls[0][0];
      expect(savedPayload.passwordHash).toBe("hashed-pw");
      expect(savedPayload).not.toHaveProperty("password");
    });

    it("returns 400 when a required field is missing", async () => {
      await usersController.register({ body: { email: "a@b.com" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(userModel.create).not.toHaveBeenCalled();
    });

    it("returns 400 for a role outside the allowed list", async () => {
      await usersController.register({ body: { ...validBody, role: "SuperAdmin" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining("role must be one of") })
      );
    });

    it("returns 400 when the password is shorter than 6 characters", async () => {
      await usersController.register({ body: { ...validBody, password: "abc" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 409 when the email is already registered", async () => {
      userModel.findByEmail.mockResolvedValue({ UserID: 99 });

      await usersController.register({ body: validBody }, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(userModel.create).not.toHaveBeenCalled();
    });

    it("forwards unexpected errors to next() instead of crashing", async () => {
      const boom = new Error("DB down");
      userModel.findByEmail.mockRejectedValue(boom);

      await usersController.register({ body: validBody }, res, next);

      expect(next).toHaveBeenCalledWith(boom);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  // =====================================================================
  // login
  // =====================================================================
  describe("login", () => {
    const creds = { email: "kenneth@np.edu.sg", password: "Password123!" };
    const dbUser = {
      UserID: 1,
      Name: "Kenneth",
      Email: creds.email,
      Role: "Patron",
      PasswordHash: "hashed-pw",
    };

    it("returns 200 with a signed JWT on valid credentials", async () => {
      userModel.findByEmail.mockResolvedValue(dbUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("fake.jwt.token");

      await usersController.login({ body: creds }, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ token: "fake.jwt.token", role: "Patron" }),
        })
      );
    });

    it("signs the token with userId, role and email only", async () => {
      userModel.findByEmail.mockResolvedValue(dbUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("fake.jwt.token");

      await usersController.login({ body: creds }, res, next);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1, role: "Patron", email: creds.email },
        "test-secret",
        expect.objectContaining({ expiresIn: expect.anything() })
      );
    });

    it("never leaks the password hash in the response", async () => {
      userModel.findByEmail.mockResolvedValue(dbUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("fake.jwt.token");

      await usersController.login({ body: creds }, res, next);

      expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain("hashed-pw");
    });

    it("returns 400 when email or password is missing", async () => {
      await usersController.login({ body: { email: "a@b.com" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(userModel.findByEmail).not.toHaveBeenCalled();
    });

    it("returns a generic 401 for an unknown email (no user enumeration)", async () => {
      userModel.findByEmail.mockResolvedValue(null);

      await usersController.login({ body: creds }, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid email or password." })
      );
    });

    it("returns the same generic 401 for a wrong password", async () => {
      userModel.findByEmail.mockResolvedValue(dbUser);
      bcrypt.compare.mockResolvedValue(false);

      await usersController.login({ body: creds }, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  // =====================================================================
  // getProfile / updateProfile / deactivateUser
  // =====================================================================
  describe("getProfile", () => {
    it("reads the id from the JWT payload, not from the request body", async () => {
      userModel.findById.mockResolvedValue({ UserID: 8, Name: "Kyra" });

      await usersController.getProfile({ user: { userId: 8 }, body: { userId: 999 } }, res, next);

      expect(userModel.findById).toHaveBeenCalledWith(8);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 when the account no longer exists", async () => {
      userModel.findById.mockResolvedValue(null);

      await usersController.getProfile({ user: { userId: 8 } }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("updateProfile", () => {
    it("returns 200 with the updated record", async () => {
      userModel.updateProfile.mockResolvedValue({ UserID: 8, Name: "Kyra Tan" });

      await usersController.updateProfile(
        { user: { userId: 8 }, body: { name: "Kyra Tan", phone: "90001111" } },
        res,
        next
      );

      expect(userModel.updateProfile).toHaveBeenCalledWith(8, { name: "Kyra Tan", phone: "90001111" });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 when name is missing", async () => {
      await usersController.updateProfile({ user: { userId: 8 }, body: {} }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(userModel.updateProfile).not.toHaveBeenCalled();
    });
  });

  describe("deactivateUser", () => {
    it("returns 200 when the account is deactivated", async () => {
      userModel.deactivate.mockResolvedValue({ UserID: 5, IsActive: false });

      await usersController.deactivateUser({ params: { id: "5" } }, res, next);

      expect(userModel.deactivate).toHaveBeenCalledWith("5");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 for an unknown id", async () => {
      userModel.deactivate.mockResolvedValue(null);

      await usersController.deactivateUser({ params: { id: "9999" } }, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
