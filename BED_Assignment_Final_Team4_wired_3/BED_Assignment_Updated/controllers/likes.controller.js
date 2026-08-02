/*
Owner: Yongsheng 
Feature: Item Likes (US10)
*/

const likeModel = require("../models/like.model");

//TOGGLE (acts as Create or Delete depending on current state)
exports.toggleLike = async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    const exists = await likeModel.itemExists(itemId);
    if (!exists) {
      return res.status(404).json({ success: false, message: "Menu item not found." });
    }

    const existingLike = await likeModel.find(req.user.userId, itemId);

    let liked;
    if (existingLike) {
      await likeModel.remove(existingLike.LikeID);
      liked = false;
    } else {
      await likeModel.create(req.user.userId, itemId);
      liked = true;
    }

    const likeCount = await likeModel.countByItemId(itemId);

    res.status(200).json({
      success: true,
      message: liked ? "Item liked." : "Like removed.",
      data: { itemId: Number(itemId), liked, likeCount },
    });
  } catch (err) {
    next(err);
  }
};

//READ: like count for an item
exports.getLikesForItem = async (req, res, next) => {
  try {
    const likeCount = await likeModel.countByItemId(req.params.itemId);
    res.status(200).json({ success: true, data: { itemId: Number(req.params.itemId), likeCount } });
  } catch (err) {
    next(err);
  }
};
