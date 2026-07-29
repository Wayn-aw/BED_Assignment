const { use } = require("react");
const { user } = require("../dbConfig");

const User = require("../models/OfficerModel");

const bcrypt = require("bcrypt");

async function getAllUsers(req, res) {
  try {
    const users = await User.getAllUsers();
    // res.json(users);

    if (!users || users === null) {
      res.status(404).json({ error: "User not found" });
    }

    if (users.length === 0) {
      return res.status(204).json({ message: "No users displayed" });
    }
    res.json(users);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving Officers" });
  }
}

async function createUser(req, res) {
  // 1. Extract the values from the request body
  const {
    OfficerName,
    OfficerContactNo,
    OfficerUsername,
    OfficerPassword, // Client sends plain text password
    OfficerRoles,
    OfficerStatus,
  } = req.body || {};

  //console.log("Extracted OfficerName:", OfficerName);

  try {
    // Name Validation
    if (
      !OfficerName ||
      OfficerName.trim() === "" ||
      OfficerName.match(/[!@#$%^&*(){}:"<>?/]/) ||
      /\d/.test(OfficerName) // Rejects strings with numbers (e.g. "Ken123")
    ) {
      return res.status(400).json({
        message:
          "Username cannot include special characters, numbers or cannot be left blank",
      });
    }

    // Contact Number Validation
    const onlyNumbers = /^[0-9]+$/;
    if (!OfficerContactNo || !onlyNumbers.test(OfficerContactNo)) {
      return res.status(400).json({
        message: "Phone number only accepts digits.",
      });
    }

    // Username Validation
    const username = OfficerUsername || "";
    if (
      !OfficerUsername ||
      OfficerUsername.trim() === "" ||
      username.length < 3 ||
      username.length > 15 ||
      username.includes("!") ||
      username.includes("?") ||
      username.includes("[") ||
      username.includes("]") ||
      username.includes("/") ||
      username.includes("{") ||
      username.includes("}") ||
      username.includes("(") ||
      username.includes(")")
    ) {
      return res.status(400).json({
        message: "Username too long or too short or is invalid",
      });
    }

    // Password Validation
    const password = OfficerPassword || "";
    if (
      !OfficerPassword ||
      OfficerPassword.trim() === "" ||
      password.length < 8
    ) {
      return res.status(400).json({
        message: "Password format is invalid or less than 8 characters.",
      });
    }

    // Roles Validation
    if (
      OfficerRoles !== "Health" &&
      OfficerRoles !== "Inspection" &&
      OfficerRoles !== "Compliance" &&
      OfficerRoles !== "Operations" &&
      OfficerRoles !== "Enforcement"
    ) {
      return res.status(400).json({ message: "Role is invalid" });
    }

    // Status Validation (Defaults to 'Active' if none is passed)
    const activeStatus = OfficerStatus || "Active";
    const statusList = ["Active", "Inactive", "Suspended", "Resigned"];
    if (!statusList.includes(activeStatus)) {
      return res.status(400).json({ message: "Status is invalid" });
    }

    // Hash password (DECLARED ONCE HERE)
    const salt = await bcrypt.genSalt(12); // more secure 10 -> 12
    const OfficerPasswordHashed = await bcrypt.hash(OfficerPassword, salt);

    // Call the model and pass the compiled object
    const newUser = await User.createUser({
      OfficerName,
      OfficerUsername,
      OfficerPasswordHashed,
      OfficerContactNo,
      OfficerRoles,
      OfficerStatus: activeStatus,
    });

    // Handle duplicates reported by the model check
    if (newUser && newUser.errorType === "EXISTS") {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    // Send successful insert response
    return res.status(201).json({
      message: "Officer created successfully",
      newUser,
    });
  } catch (err) {
    console.error("Error in controller:", err);
    return res.status(500).json({
      message: "Internal server error",
      details: err.message,
    });
  }
}

async function updateUsersStatus(req, res) {
  try {
    const { username } = req.params;

    if (
      req.body.OfficerStatus !== "Active" &&
      req.body.OfficerStatus !== "Inactive" &&
      req.body.OfficerStatus !== "Suspended" &&
      req.body.OfficerStatus !== "Resigned"
    ) {
      return res.status(400).json({
        message: "Officer status is not valid.",
      });
    }

    const updatedStatus = {
      OfficerUsername: req.body.OfficerUsername,
      OfficerStatus: req.body.OfficerStatus,
    };

    const modifyStatusAvailability = await User.updateUsersStatus(
      username,
      updatedStatus,
    );

    if (!modifyStatusAvailability || modifyStatusAvailability === null) {
      return res.status(404).json({
        error: "Officer not found",
      });
    }

    return res.status(200).json(modifyStatusAvailability);
  } catch (error) {
    console.error("Controller error:", error);
    return res.status(500).json({
      error: "Error updating Officer",
      message: error.message,
    });
  }
}

async function deleteOfficerById(req, res) {
  try {
    const id = req.params.id;

    //console.log("DELETE ID:", id);
    const user = await User.deleteOfficerById(id);
    //console.log(Officer);
    if (!user || user === null) {
      res.statusCode = 400; //old format for vanilla JS (withour Express())
      return res.end("Officer not found");
      //return res.status(404).json({ error: "Officer not found" });
    }
    //console.log("Delete result:", user);
    // const deleted = await User.deleteOfficerById(id);
    // if (!deleted || deleted === null) {
    //   res.statusCode = 400;
    //   return res.end("Deleted failed");
    // }
    return res.json({
      message: "Officer deleted successfully",
      id: id,
    });
  } catch (error) {
    //console.error("Controller error:", error);
    res
      .status(500)
      .json({ error: "Error retrieving officer", message: error.message });
  }
}

async function getOfficerbyID(req, res) {
  try {
    const id = req.params.id;
    const officer = await User.getOfficerById(id);
    //console.log(student);
    if (!officer || officer === null) {
      return res.status(404).json({ error: "Officer not found" });
    }

    res.json(officer);
  } catch (error) {
    console.error("Controller error:", error);
    res
      .status(500)
      .json({ error: "Error retrieving officer", message: error.message });
  }
}

module.exports = {
  getAllUsers,
  createUser,
  updateUsersStatus,
  deleteOfficerById,
  getOfficerbyID,
};
