/*
Owner: Kenneth
Feature: Account Management (US2)

Swagger note: the #swagger comments must sit INSIDE the router.<method>(...)
parentheses, between the path and the controller reference. swagger.js reads
them at build time to produce docs/swagger-output.json.
Bare autogen output only guesses at parameters, so every route is annotated
with its tag, summary, request body and the status codes it can really return.
*/

const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.post(
  "/register",
  // #swagger.tags = ['Users']
  // #swagger.summary = 'Register a new account'
  // #swagger.description = 'Creates a Patron, Vendor, NEAOfficer, Operator or Admin account. The password is hashed with bcrypt before it is stored.'
  /* #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } } } */
  /* #swagger.responses[201] = { description: 'Account created successfully.' } */
  /* #swagger.responses[400] = { description: 'Missing field, invalid role, or password shorter than 6 characters.' } */
  /* #swagger.responses[409] = { description: 'An account with this email already exists.' } */
  usersController.register
);

router.post(
  "/login",
  // #swagger.tags = ['Users']
  // #swagger.summary = 'Log in and receive a JWT'
  // #swagger.description = 'Returns a signed JWT. Send it on protected routes as the header: Authorization: Bearer <token>'
  /* #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } } } */
  /* #swagger.responses[200] = { description: 'Login successful, token returned.' } */
  /* #swagger.responses[400] = { description: 'email or password missing.' } */
  /* #swagger.responses[401] = { description: 'Invalid email or password.' } */
  usersController.login
);

router.get(
  "/profile",
  // #swagger.tags = ['Users']
  // #swagger.summary = 'Get the logged-in users own profile'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.responses[200] = { description: 'Profile returned. Never includes PasswordHash.' } */
  /* #swagger.responses[401] = { description: 'No token provided.' } */
  /* #swagger.responses[404] = { description: 'User not found.' } */
  verifyToken,
  usersController.getProfile
);

router.put(
  "/profile",
  // #swagger.tags = ['Users']
  // #swagger.summary = 'Update the logged-in users own profile'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string", example: "Kenneth Lim" }, phone: { type: "string", example: "91234567" } } } } } } */
  /* #swagger.responses[200] = { description: 'Profile updated.' } */
  /* #swagger.responses[400] = { description: 'name is required.' } */
  verifyToken,
  usersController.updateProfile
);

router.get(
  "/:id",
  // #swagger.tags = ['Users']
  // #swagger.summary = 'Get any user by ID (Admin / Operator only)'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = { in: 'path', description: 'UserID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'User returned.' } */
  /* #swagger.responses[403] = { description: 'Caller is not an Admin or Operator.' } */
  /* #swagger.responses[404] = { description: 'User not found.' } */
  verifyToken,
  requireRole("Admin", "Operator"),
  usersController.getUserById
);

router.delete(
  "/:id",
  // #swagger.tags = ['Users']
  // #swagger.summary = 'Deactivate an account (Admin only, soft delete)'
  // #swagger.description = 'Sets IsActive = 0 rather than deleting the row, so past orders and audit history stay intact.'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = { in: 'path', description: 'UserID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'Account deactivated.' } */
  /* #swagger.responses[403] = { description: 'Caller is not an Admin.' } */
  /* #swagger.responses[404] = { description: 'User not found.' } */
  verifyToken,
  requireRole("Admin"),
  usersController.deactivateUser
);

module.exports = router;
