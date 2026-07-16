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

INSERT INTO NEA_Officer (OfficerID, OfficerName, OfficerContactNo, OfficerUsername, OfficerPasswordHashed, OfficerRoles, OfficerStatus) VALUES
('OFF001', 'Officer John Doe', '61112222','John001','123','Health','Active'),
('OFF002', 'Officer Jane Smith', '62223333','Jane002','12345678','Health','Active'),
('OFF003', 'Officer Peter Parker', '63334444','Peter003','12345','Inspection','Suspended'),
('OFF004', 'Officer Bruce Wayne', '64445555','Bruce004','Password','Compliance','Active'),
('OFF005', 'Officer Clark Kent', '65556666','Clark005','Pa$$w0rd','Inspection','Active'),
('OFF006', 'Officer Diana Prince', '66667777','Diana006','Password10','Enforcement','Inactive'),
('OFF007', 'Officer Barry Allen', '67778888','Barry007','Barry','Enforcement','Inactive'),
('OFF008', 'Officer Hal Jordan', '68889999','Hal008','Spain','Operations','Inactive'),
('OFF009', 'Officer Arthur Curry', '69990000','Arthur009','admin','Operations','Resigned'),
('OFF010', 'Officer Victor Stone', '60001111','Stone010','qwerty','Compliance','Active');