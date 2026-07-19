/**
 * routes/likes.routes.js
 * Owner: Yongsheng | Feature: Item Likes (US10)
 */

const express = require("express");
const router = express.Router();
const likesController = require("../controllers/likes.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.put("/:itemId", verifyToken, requireRole("Patron"), likesController.toggleLike);
router.get("/:itemId", likesController.getLikesForItem);

module.exports = router;
