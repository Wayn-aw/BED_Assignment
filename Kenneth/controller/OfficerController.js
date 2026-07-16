const { user } = require("../dbConfig");

const User = require("../models/OfficerModel");

async function getAllUsers(req, res) {
  try {
    const users = await User.getAllUsers();
    res.json(users);

    if (!users || users === null) {
      res.status(404).json({ error: "User not found" });
    }

    if (user.length === 0) {
      return res.status(204).json({ message: "No users displayed" });
    }
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving books" });
  }
}

module.exports = {
  getAllUsers,
};
