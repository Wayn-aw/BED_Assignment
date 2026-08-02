/*
Owner: Wayne
Feature: Vendor Menu CRUD (US6)
*/

const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menu.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, requireRole("Vendor"), menuController.createMenuItem);
router.get("/:id", menuController.getMenuItemById);
router.put("/:id", verifyToken, requireRole("Vendor"), menuController.updateMenuItem);
router.delete("/:id", verifyToken, requireRole("Vendor"), menuController.deleteMenuItem);

module.exports = router;
