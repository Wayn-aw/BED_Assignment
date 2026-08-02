/*
Owner: Yongsheng
Feature: Item Likes (US10)
*/

const express = require("express");
const router = express.Router();
const likesController = require("../controllers/likes.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.put(
  "/:itemId",
  // #swagger.tags = ['Likes']
  // #swagger.summary = 'Toggle a like on a menu item (Patron only)'
  // #swagger.description = 'Acts as create-or-delete: if the caller has not liked this item yet it is liked, otherwise the existing like is removed. Returns the new liked state and the updated total count.'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['itemId'] = { in: 'path', description: 'MenuItemID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'Like toggled; returns liked (boolean) and likeCount.' } */
  /* #swagger.responses[404] = { description: 'Menu item not found.' } */
  verifyToken,
  requireRole("Patron"),
  likesController.toggleLike
);

router.get(
  "/:itemId",
  // #swagger.tags = ['Likes']
  // #swagger.summary = 'Get the like count for a menu item (public)'
  /* #swagger.parameters['itemId'] = { in: 'path', description: 'MenuItemID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'Like count returned.' } */
  likesController.getLikesForItem
);

module.exports = router;
