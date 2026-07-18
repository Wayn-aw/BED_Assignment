/* =====================================================================
   HawkerHub Database Schema
   Singapore Hawker Centre Management System
   Target: Microsoft SQL Server 2019+

   Run this file first, then 02_seed.sql to load sample data.
   ===================================================================== */

IF DB_ID('HawkerHubDB') IS NULL
BEGIN
    CREATE DATABASE HawkerHubDB;
END
GO

USE HawkerHubDB;
GO

/* ---------- Drop tables if they exist (children first) ---------- */
IF OBJECT_ID('dbo.HygieneGrades', 'U') IS NOT NULL DROP TABLE dbo.HygieneGrades;
IF OBJECT_ID('dbo.Inspections', 'U') IS NOT NULL DROP TABLE dbo.Inspections;
IF OBJECT_ID('dbo.Complaints', 'U') IS NOT NULL DROP TABLE dbo.Complaints;
IF OBJECT_ID('dbo.ItemLikes', 'U') IS NOT NULL DROP TABLE dbo.ItemLikes;
IF OBJECT_ID('dbo.Feedback', 'U') IS NOT NULL DROP TABLE dbo.Feedback;
IF OBJECT_ID('dbo.Payments', 'U') IS NOT NULL DROP TABLE dbo.Payments;
IF OBJECT_ID('dbo.OrderItems', 'U') IS NOT NULL DROP TABLE dbo.OrderItems;
IF OBJECT_ID('dbo.Orders', 'U') IS NOT NULL DROP TABLE dbo.Orders;
IF OBJECT_ID('dbo.Promotions', 'U') IS NOT NULL DROP TABLE dbo.Promotions;
IF OBJECT_ID('dbo.MenuItemCuisines', 'U') IS NOT NULL DROP TABLE dbo.MenuItemCuisines;
IF OBJECT_ID('dbo.MenuItems', 'U') IS NOT NULL DROP TABLE dbo.MenuItems;
IF OBJECT_ID('dbo.Cuisines', 'U') IS NOT NULL DROP TABLE dbo.Cuisines;
IF OBJECT_ID('dbo.RentalAgreements', 'U') IS NOT NULL DROP TABLE dbo.RentalAgreements;
IF OBJECT_ID('dbo.Stalls', 'U') IS NOT NULL DROP TABLE dbo.Stalls;
IF OBJECT_ID('dbo.HawkerCentres', 'U') IS NOT NULL DROP TABLE dbo.HawkerCentres;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO

/* =====================================================================
   1. USERS  (Patrons, Vendors, NEA Officers, Operators, Admins)
   Owner: Kenneth (Account Management)
   ===================================================================== */
CREATE TABLE Users (
    UserID          INT IDENTITY(1,1) PRIMARY KEY,
    Name            VARCHAR(100)  NOT NULL,
    Email           VARCHAR(150)  NOT NULL UNIQUE,
    PasswordHash    VARCHAR(255)  NOT NULL,
    Role            VARCHAR(20)   NOT NULL
                     CHECK (Role IN ('Patron','Vendor','NEAOfficer','Operator','Admin')),
    Phone           VARCHAR(20)   NULL,
    CreatedAt       DATETIME      NOT NULL DEFAULT GETDATE(),
    IsActive        BIT           NOT NULL DEFAULT 1
);
GO

/* =====================================================================
   2. HAWKER CENTRES  (managed by an Operator)
   ===================================================================== */
CREATE TABLE HawkerCentres (
    CentreID        INT IDENTITY(1,1) PRIMARY KEY,
    Name            VARCHAR(150) NOT NULL,
    Address         VARCHAR(255) NOT NULL,
    OperatorID      INT NULL REFERENCES Users(UserID),
    CreatedAt       DATETIME NOT NULL DEFAULT GETDATE()
);
GO

/* =====================================================================
   3. STALLS  (each owned by one Vendor, sits in one Hawker Centre)
   Owner: Wayne (Vendor Menu CRUD uses this as FK) / Kyra (Browse - GET)
   ===================================================================== */
CREATE TABLE Stalls (
    StallID         INT IDENTITY(1,1) PRIMARY KEY,
    CentreID        INT NOT NULL REFERENCES HawkerCentres(CentreID),
    OwnerID         INT NOT NULL REFERENCES Users(UserID),
    StallName       VARCHAR(150) NOT NULL,
    Description     VARCHAR(500) NULL,
    ImageURL        VARCHAR(300) NULL,
    CreatedAt       DATETIME NOT NULL DEFAULT GETDATE()
);
GO

/* =====================================================================
   4. RENTAL AGREEMENTS
   Owner: Yongsheng (Vendor Rental Tracking - US7)
   A stall can have MULTIPLE historical agreements (renewals).
   ===================================================================== */
CREATE TABLE RentalAgreements (
    AgreementID     INT IDENTITY(1,1) PRIMARY KEY,
    StallID         INT NOT NULL REFERENCES Stalls(StallID),
    StartDate       DATE NOT NULL,
    EndDate         DATE NOT NULL,
    MonthlyRent     DECIMAL(10,2) NOT NULL CHECK (MonthlyRent >= 0),
    Status          VARCHAR(20) NOT NULL DEFAULT 'Active'
                     CHECK (Status IN ('Active','Expired','Terminated')),
    CreatedAt       DATETIME NOT NULL DEFAULT GETDATE(),
    CHECK (EndDate >= StartDate)
);
GO

/* =====================================================================
   5. CUISINES  +  MENU ITEMS  (many-to-many: one item can belong to
   several cuisines, per Appendix A)
   Owner: Wayne (Vendor Menu CRUD - US6)
   ===================================================================== */
CREATE TABLE Cuisines (
    CuisineID       INT IDENTITY(1,1) PRIMARY KEY,
    Name            VARCHAR(50) NOT NULL UNIQUE
);
GO

CREATE TABLE MenuItems (
    ItemID          INT IDENTITY(1,1) PRIMARY KEY,
    StallID         INT NOT NULL REFERENCES Stalls(StallID),
    ItemName        VARCHAR(100) NOT NULL,
    Description     VARCHAR(300) NULL,
    Price           DECIMAL(8,2) NOT NULL CHECK (Price >= 0),
    Category        VARCHAR(30)  NOT NULL DEFAULT 'Main'
                     CHECK (Category IN ('Main','Drink','Dessert','Side')),
    ImageURL        VARCHAR(300) NULL,
    IsAvailable     BIT NOT NULL DEFAULT 1,
    CreatedAt       DATETIME NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE MenuItemCuisines (
    ItemID          INT NOT NULL REFERENCES MenuItems(ItemID) ON DELETE CASCADE,
    CuisineID       INT NOT NULL REFERENCES Cuisines(CuisineID),
    PRIMARY KEY (ItemID, CuisineID)
);
GO

/* =====================================================================
   6. PROMOTIONS
   Owner: Jeremiah (Vendor Promotions - US14)
   ===================================================================== */
CREATE TABLE Promotions (
    PromoID             INT IDENTITY(1,1) PRIMARY KEY,
    StallID             INT NOT NULL REFERENCES Stalls(StallID),
    Title               VARCHAR(100) NOT NULL,
    DiscountPercentage  INT NOT NULL CHECK (DiscountPercentage BETWEEN 1 AND 100),
    StartDate           DATETIME NOT NULL,
    EndDate             DATETIME NOT NULL,
    CreatedAt           DATETIME NOT NULL DEFAULT GETDATE(),
    CHECK (EndDate > StartDate)
);
GO

/* =====================================================================
   7. ORDERS  +  ORDER ITEMS
   Owner: Wayne (Add to Cart & Checkout - US3)
   Guest checkout allowed -> PatronID is nullable.
   ===================================================================== */
CREATE TABLE Orders (
    OrderID         INT IDENTITY(1,1) PRIMARY KEY,
    PatronID        INT NULL REFERENCES Users(UserID),
    StallID         INT NOT NULL REFERENCES Stalls(StallID),
    OrderStatus     VARCHAR(20) NOT NULL DEFAULT 'Pending'
                     CHECK (OrderStatus IN ('Pending','Preparing','Ready','Collected','Cancelled')),
    TotalAmount     DECIMAL(10,2) NOT NULL CHECK (TotalAmount >= 0),
    OrderDate       DATETIME NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE OrderItems (
    OrderItemID     INT IDENTITY(1,1) PRIMARY KEY,
    OrderID         INT NOT NULL REFERENCES Orders(OrderID) ON DELETE CASCADE,
    ItemID          INT NOT NULL REFERENCES MenuItems(ItemID),
    Quantity        INT NOT NULL CHECK (Quantity > 0),
    UnitPrice       DECIMAL(8,2) NOT NULL CHECK (UnitPrice >= 0),
    Subtotal        AS (Quantity * UnitPrice) PERSISTED
);
GO

/* =====================================================================
   8. PAYMENTS  (one payment per order)
   Owner: Kenneth (Payment Confirmation / Multiple Payment Options - US8, US9)
   ===================================================================== */
CREATE TABLE Payments (
    PaymentID       INT IDENTITY(1,1) PRIMARY KEY,
    OrderID         INT NOT NULL UNIQUE REFERENCES Orders(OrderID) ON DELETE CASCADE,
    PaymentMethod   VARCHAR(20) NOT NULL
                     CHECK (PaymentMethod IN ('Cash','NETS','PayNow','CreditCard')),
    Amount          DECIMAL(10,2) NOT NULL CHECK (Amount >= 0),
    PaymentStatus   VARCHAR(20) NOT NULL DEFAULT 'Pending'
                     CHECK (PaymentStatus IN ('Pending','Success','Failed')),
    PaidAt          DATETIME NULL
);
GO

/* =====================================================================
   9. FEEDBACK
   Owner: Kyra (Patron Feedback - US5)
   ===================================================================== */
CREATE TABLE Feedback (
    FeedbackID      INT IDENTITY(1,1) PRIMARY KEY,
    PatronID        INT NOT NULL REFERENCES Users(UserID),
    StallID         INT NOT NULL REFERENCES Stalls(StallID),
    Rating          INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comments        VARCHAR(500) NULL,
    CreatedAt       DATETIME NOT NULL DEFAULT GETDATE()
);
GO

/* =====================================================================
   10. ITEM LIKES
   Owner: Yongsheng (Item Likes - US10)
   ===================================================================== */
CREATE TABLE ItemLikes (
    LikeID          INT IDENTITY(1,1) PRIMARY KEY,
    PatronID        INT NOT NULL REFERENCES Users(UserID),
    ItemID          INT NOT NULL REFERENCES MenuItems(ItemID),
    CreatedAt       DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_Patron_Item_Like UNIQUE (PatronID, ItemID)
);
GO

/* =====================================================================
   11. COMPLAINTS
   Owner: Kyra (Lodge Customer Complaint - US13)
   ===================================================================== */
CREATE TABLE Complaints (
    ComplaintID     INT IDENTITY(1,1) PRIMARY KEY,
    PatronID        INT NOT NULL REFERENCES Users(UserID),
    StallID         INT NOT NULL REFERENCES Stalls(StallID),
    Description     VARCHAR(500) NOT NULL,
    Status          VARCHAR(20) NOT NULL DEFAULT 'Open'
                     CHECK (Status IN ('Open','Investigating','Resolved','Dismissed')),
    CreatedAt       DATETIME NOT NULL DEFAULT GETDATE()
);
GO

/* =====================================================================
   12. INSPECTIONS  +  HYGIENE GRADES
   Owner: Jeremiah (NEA Hygiene Inspections & Grades - US4, US12)
   A stall may have multiple historical hygiene grades over time.
   ===================================================================== */
CREATE TABLE Inspections (
    InspectionID    INT IDENTITY(1,1) PRIMARY KEY,
    StallID         INT NOT NULL REFERENCES Stalls(StallID),
    OfficerID       INT NOT NULL REFERENCES Users(UserID),
    Score           INT NOT NULL CHECK (Score BETWEEN 0 AND 100),
    Remarks         VARCHAR(500) NULL,
    InspectionDate  DATE NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE HygieneGrades (
    GradeID         INT IDENTITY(1,1) PRIMARY KEY,
    InspectionID    INT NOT NULL REFERENCES Inspections(InspectionID) ON DELETE CASCADE,
    StallID         INT NOT NULL REFERENCES Stalls(StallID),
    Grade           CHAR(1) NOT NULL CHECK (Grade IN ('A','B','C','D')),
    ValidFrom       DATE NOT NULL DEFAULT GETDATE(),
    ValidTo         DATE NULL
);
GO

PRINT 'HawkerHub schema created successfully.';
GO
