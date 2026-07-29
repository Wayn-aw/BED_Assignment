// book.test.js
const Officer = require("./models/OfficerModel");
const sql = require("mssql");

jest.mock("mssql"); // Mock the mssql library

describe("Officer.getAllUsers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should retrieve all officers from the database", async () => {
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
    const mockRequest = {
      query: jest.fn().mockResolvedValue({ recordset: mockOfficers }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };

    sql.connect.mockResolvedValue(mockConnection); // Return the mock connection

    const officers = await Officer.getAllUsers();

    expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
    expect(officers).toHaveLength(2);
    expect(officers[0].OfficerID).toBe("OFF001");
    expect(officers[0].OfficerName).toBe("Officer John Doe");
    expect(officers[0].OfficerContactNo).toBe("61112222");
    expect(officers[0].OfficerUsername).toBe("John001");
    expect(officers[0].OfficerRoles).toBe("Health");
    expect(officers[0].OfficerStatus).toBe("Active");
  });

  it("should handle errors when retrieving Officer", async () => {
    const errorMessage = "Database Error";
    sql.connect.mockRejectedValue(new Error(errorMessage));
    await expect(Officer.getAllUsers()).rejects.toThrow(errorMessage);
  });
});
