const Joi = require("joi"); // Import Joi for validation

// Validation schema for users (used for POST/PUT)
const userSchema = Joi.object({
  OfficerUsername: Joi.string().alphanum().min(1).max(255).required().messages({
    "string.base": "username must be a string",
    "string.empty": "username cannot be empty",
    "string.alphanum": "username must contain only letters and numbers",
    "string.min": "username must be at least 1 character long",
    "string.max": "username cannot exceed 255 characters",
    "any.required": "username is required",
  }),
  OfficerPasswordHashed: Joi.string()
    .pattern(/[a-z]/, "lowercase")
    .pattern(/[A-Z]/, "uppercase")
    .pattern(/[0-9]/, "number")
    .pattern(/[!@#$%^&*]/, "symbol")
    .min(8)
    .max(255)
    .required()
    .messages({
      "string.base": "PasswordHashed must be a string",
      "string.empty": "PasswordHashed cannot be empty",
      "string.pattern.name":
        "password must contain at least one {#name} character",
      "string.min": "PasswordHashed must be at least 8 character long",
      "string.max": "PasswordHashed cannot exceed 255 characters",
      "any.required": "PasswordHashed is required",
    }),
  OfficerContactNo: Joi.number().min(8).max(8).required().messages({
    "string.base": "ContactNo must be an integer",
    "string.empty": "ContactNo cannot be empty",
    "string.min": "ContactNo must be at least 8 digits long",
    "string.max": "ContactNo cannot exceed 8 digits",
    "any.required": "ContactNo is required",
  }),
  // Add validation for other fields if necessary (e.g., year, genre)
  role: Joi.string()
    .valid("Health", "Inspection", "Compliance", "Operations", "Enforcement")
    .required(),
  OfficerStatus: Joi.string()
    .valid("Active", "Inactive", "Resigned", "Suspended")
    .required(),
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

module.exports = {
  validateuser,
};
