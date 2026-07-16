CREATE DATABASE NEA_Officers;

CREATE TABLE NEA_Officer ( -- FIXED: Added Underscore to match Logical Design
    OfficerID Char(6) PRIMARY KEY,
    OfficerName VarChar(50) NOT NULL,
    OfficerContactNo Char(8) NOT NULL, -- FIXED: Added Comma
    OfficerUsername VarChar(100) NOT NULL,
    OfficerPasswordHashed VarChar(255) NOT NULL,
    OfficerRoles VarChar(255) NOT NULL CONSTRAINT CHK_OfficerRoles CHECK (OfficerRoles IN ('Health', 'Inspection', 'Compliance', 'Operations', 'Enforcement')),
    OfficerStatus VarChar(255) NOT NULL CONSTRAINT CHK_OfficerStatus CHECK (OfficerStatus IN ('Active', 'Inactive', 'Suspended', 'Resigned'))
);

