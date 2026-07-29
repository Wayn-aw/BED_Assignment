// Controller.test.js

const officerController = require("./controller/OfficerController");
const Officer = require("./models/OfficerModel");

// Mock the Officer model
jest.mock("./models/OfficerModel"); // Replace with the actual path to your Book model

describe("officerController.getAllUsers", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mock calls before each test
  });

  it("should fetch all officers and return a JSON response", async () => {
    const mockOfficers = [
      {
        OfficerID: "OFF001",
        OfficerName: "Officer John Doe",
        OfficerContactNo: "61112222",
        OfficerUsername: "John001",
        OfficerPasswordHashed: "123",
        OfficerRoles: "Health",
        OfficerStatus: "Active",
      },
      {
        OfficerID: "OFF002",
        OfficerName: "Officer Jane Smith",
        OfficerContactNo: "62223333",
        OfficerUsername: "Jane002",
        OfficerPasswordHashed: "12345678",
        OfficerRoles: "Health",
        OfficerStatus: "Active",
      },
    ];

    // Mock the function to return the mock data

    Officer.getAllUsers.mockResolvedValue(mockOfficers);
    const req = {}; //need define req for now its empty
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await officerController.getAllUsers(req, res);

    expect(Officer.getAllUsers).toHaveBeenCalledTimes(1); // Check if getAllBooks was called
    expect(res.json).toHaveBeenCalledWith(mockOfficers);
    console.log(mockOfficers); // Check the response body
  });
  //console.log(mockOfficers);
  it("should handle errors and return a 500 status with error message", async () => {
    const errorMessage = "Database error";
    Officer.getAllUsers.mockRejectedValue(new Error(errorMessage)); // Simulate an error

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(), //need match because i used JSON instead of SEND
    };

    await officerController.getAllUsers(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Error retrieving Officers",
    });
  });
});
