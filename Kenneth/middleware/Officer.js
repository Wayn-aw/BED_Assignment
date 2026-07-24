const Joi = require("joi"); // Import Joi for validation

// Validation schema for users (used for POST/PUT)
const userSchema = Joi.object({
  OfficerName: Joi.string().required().messages({
    "string.empty": "OfficerName cannot be empty",
    "any.required": "OfficerName is required",
  }),
  OfficerUsername: Joi.string().alphanum().min(1).max(255).required().messages({
    "string.base": "username must be a string",
    "string.empty": "username cannot be empty",
    "string.alphanum": "username must contain only letters and numbers",
    "string.min": "username must be at least 1 character long",
    "string.max": "username cannot exceed 255 characters",
    "any.required": "username is required",
  }),
  // FIX 1: Changed to OfficerPassword (since client sends raw password before hashing!)
  OfficerPassword: Joi.string()
    .pattern(/[a-z]/, "lowercase")
    .pattern(/[A-Z]/, "uppercase")
    .pattern(/[0-9]/, "number")
    .pattern(/[!@#$%^&*]/, "symbol")
    .min(8)
    .max(255)
    .required()
    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password cannot be empty",
      "string.pattern.name":
        "password must contain at least one {#name} character",
      "string.min": "Password must be at least 8 characters long",
      "string.max": "Password cannot exceed 255 characters",
      "any.required": "Password is required",
    }),
  // FIX 2: Fixed Joi number validation bounds for length checking
  OfficerContactNo: Joi.string()
    .pattern(/^[0-9]{8}$/)
    .required()
    .messages({
      "string.base": "ContactNo must be a string of digits",
      "string.empty": "ContactNo cannot be empty",
      "string.pattern.base": "ContactNo must be exactly 8 digits long",
      "any.required": "ContactNo is required",
    }),
  // FIX 3: Changed 'role' to 'OfficerRoles' to match your payload variables
  OfficerRoles: Joi.string()
    .valid("Health", "Inspection", "Compliance", "Operations", "Enforcement")
    .required()
    .messages({
      "any.only": "Role is invalid",
      "any.required": "Role is required",
    }),
  OfficerStatus: Joi.string()
    .valid("Active", "Inactive", "Resigned", "Suspended")
    .required()
    .messages({
      "any.only": "Status is invalid",
      "any.required": "Status is required",
    }),
});

// Middleware to validate user data (for POST/PUT)
function validateuser(req, res, next) {
  // Validate the request body against the userSchema
  const { error } = userSchema.validate(req.body, { abortEarly: false }); // abortEarly: false collects all errors

  if (error) {
    // If validation fails, format the error messages and send a 400 response
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ error: errorMessage });
  }

  // If validation succeeds, pass control to the next middleware/route handler
  next();
}

// Middleware to validate user ID from URL parameters (for GET by ID, PUT, DELETE)
function validateuserId(req, res, next) {
  // Parse the ID from request parameters
  const id = parseInt(req.params.id);

  // Check if the parsed ID is a valid positive number
  if (isNaN(id) || id <= 0) {
    // If not valid, send a 400 response
    return res
      .status(400)
      .json({ error: "Invalid user ID. ID must be a positive number" });
  }

  // If validation succeeds, pass control to the next middleware/route handler
  next();
}

function validateOfficerStatus(req, res, next) {
  // Parse the ID from request parameters
  const status = req.body.OfficerStatus;

  // Check if the parsed ID is a valid positive number
  if (!status || status === null) {
    // If not valid, send a 400 response
    return res.status(400).json({
      error: "Invalid officer status. status must not be blank",
    });
  }

  if (
    status !== "Active" &&
    status !== "Suspended" &&
    status !== "Inactive" &&
    status != "Resigned"
  ) {
    return res.status(400).json({
      message:
        "Availability must be set to either Active  Suspended,  Inactive or Resigned",
    });
  }
  // If validation succeeds, pass control to the next middleware/route handler
  next();
}

module.exports = {
  validateuser,
  validateuserId,
  validateOfficerStatus,
};
