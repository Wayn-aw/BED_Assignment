const express = require("express");
const router = express.Router();

const officerController = require("../controllers/officerController");

router.post(
  "/createNEAOfficer",
  /*
      #swagger.tags = ['NEA Officer']
      #swagger.summary = 'Create a new NEA Officer'

      #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: {
          OfficerName: "John Tan",
          OfficerContactNo: "91234567",
          OfficerUsername: "johntan",
          OfficerPassword: "password123",
          OfficerRoles: "Health"
        }
      }

      #swagger.responses[201] = {
        description: "Officer created successfully"
      }

      #swagger.responses[400] = {
        description: "Bad Request"
      }

      #swagger.responses[500] = {
        description: "Internal Server Error"
      }
    */
  officerController.createOfficer,
);

module.exports = router;
