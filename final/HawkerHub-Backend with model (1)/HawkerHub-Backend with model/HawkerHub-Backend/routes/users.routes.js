/**
 * routes/users.routes.js
 * Owner: Kenneth | Feature: Account Management (US2)
 */

const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.post("/register", usersController.register);
router.post("/login", usersController.login);

router.get("/profile", verifyToken, usersController.getProfile);
router.put("/profile", verifyToken, usersController.updateProfile);

router.get("/:id", verifyToken, requireRole("Admin", "Operator"), usersController.getUserById);
router.delete("/:id", verifyToken, requireRole("Admin"), usersController.deactivateUser);

module.exports = router;
