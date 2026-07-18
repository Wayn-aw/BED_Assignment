/**
 * routes/stalls.routes.js
 * Owner: Kyra | Feature: Browse Food Stalls & Menu (US1)
 * Public endpoints - no login required to browse.
 */

const express = require("express");
const router = express.Router();
const stallsController = require("../controllers/stalls.controller");

router.get("/", stallsController.getAllStalls);
router.get("/:id", stallsController.getStallById);

module.exports = router;
