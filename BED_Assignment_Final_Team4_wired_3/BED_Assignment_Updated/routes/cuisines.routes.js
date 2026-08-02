/*
Owner: Wayne
Feature: Cuisines lookup (supports Vendor Menu CRUD - US6)
*/

const express = require("express");
const router = express.Router();
const cuisinesController = require("../controllers/cuisines.controller");

router.get(
  "/",
  // #swagger.tags = ['Cuisines']
  // #swagger.summary = 'List all cuisines (public)'
  // #swagger.description = 'Use these CuisineIDs in the cuisineIds array when creating a menu item.'
  /* #swagger.responses[200] = { description: 'Cuisines returned.' } */
  cuisinesController.getAllCuisines
);

module.exports = router;
