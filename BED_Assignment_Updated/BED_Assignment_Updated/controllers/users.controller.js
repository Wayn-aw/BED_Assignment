/*
Owner: Kenneth 
Feature: Account Management (US2)
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

//CREATE: Register a new user
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "name, email, password and role are required." });
    }
    const allowedRoles = ["Patron", "Vendor", "NEAOfficer", "Operator", "Admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `role must be one of: ${allowedRoles.join(", ")}` });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await userModel.create({ name, email, passwordHash, role, phone });

    res.status(201).json({ success: true, message: "Account created successfully.", data: newUser });
  } catch (err) {
    next(err);
  }
};

//AUTH: Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "email and password are required." });
    }

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const match = await bcrypt.compare(password, user.PasswordHash);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { userId: user.UserID, role: user.Role, email: user.Email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: { token, userId: user.UserID, name: user.Name, role: user.Role },
    });
  } catch (err) {
    next(err);
  }
};

//READ: own profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

//READ: user by id (Admin/Operator)
exports.getUserById = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

//UPDATE: own profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "name is required." });
    }

    const updated = await userModel.updateProfile(req.user.userId, { name, phone });
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.status(200).json({ success: true, message: "Profile updated.", data: updated });
  } catch (err) {
    next(err);
  }
};

//DELETE: deactivate account (soft delete keeps order/audit history intact)
exports.deactivateUser = async (req, res, next) => {
  try {
    const result = await userModel.deactivate(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.status(200).json({ success: true, message: "Account deactivated.", data: result });
  } catch (err) {
    next(err);
  }
};
