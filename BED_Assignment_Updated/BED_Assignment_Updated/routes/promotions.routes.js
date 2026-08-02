/*
Owner: Jeremiah 
Feature: Vendor Promotions (US14)
*/

const express = require("express");
const router = express.Router();
const promotionsController = require("../controllers/promotions.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, requireRole("Vendor"), promotionsController.createPromotion);
router.get("/stall/:id", promotionsController.getPromotionsForStall);
router.delete("/:id", verifyToken, requireRole("Vendor"), promotionsController.deletePromotion);

module.exports = router;
