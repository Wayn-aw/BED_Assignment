/**
 * routes/inspections.routes.js
 * Owner: Jeremiah | Feature: NEA Hygiene Inspections & Grades (US4, US12)
 */

const express = require("express");
const router = express.Router();
const inspectionsController = require("../controllers/inspections.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, requireRole("NEAOfficer"), inspectionsController.createInspection);
router.get("/stall/:id", inspectionsController.getInspectionHistory); // public - transparency for patrons/vendors
router.put("/:id", verifyToken, requireRole("NEAOfficer"), inspectionsController.updateInspection);
router.delete("/:id", verifyToken, requireRole("NEAOfficer"), inspectionsController.deleteInspection);

module.exports = router;
