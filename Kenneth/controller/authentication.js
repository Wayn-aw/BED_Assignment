const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const { registerUser } = require("../models/OfficerModel"); //helper functions
const { getOfficerbyUsername } = require("./OfficerController");

async function login(req, res) {
  const { username, password } = req.body;

  try {
    // Validate user credentials
    const user = await getOfficerbyUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password with hash
    const isMatch = await bcrypt.compare(password, user.OfficerPasswordHashed);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const payload = {
      id: user.OfficerID,
      role: user.OfficerRoles,
    };
    const token = jwt.sign(payload, process.env.your_secret_key, {
      expiresIn: "3600s",
    }); // Expires in 1 hour

    return res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
module.exports = {
  login,
};
