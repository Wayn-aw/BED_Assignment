CREATE DATABASE NEA_Officers;



CREATE TABLE NEA_Officer (
    
    ID INT IDENTITY(1,1) UNIQUE, 
    
    
    OfficerID AS CAST('OFF' + RIGHT('000' + CAST(ID AS VARCHAR(3)), 3) AS CHAR(6)) PERSISTED PRIMARY KEY,
    
    OfficerName VARCHAR(50) NOT NULL,
    OfficerContactNo CHAR(8) NOT NULL,
    OfficerUsername VARCHAR(100) NOT NULL,
    OfficerPasswordHashed VARCHAR(255) NOT NULL,
    OfficerRoles VARCHAR(255) NOT NULL CONSTRAINT CHK_OfficerRoles CHECK (OfficerRoles IN ('Health', 'Inspection', 'Compliance', 'Operations', 'Enforcement')),
    OfficerStatus VARCHAR(255) NOT NULL CONSTRAINT CHK_OfficerStatus CHECK (OfficerStatus IN ('Active', 'Inactive', 'Suspended', 'Resigned'))
);
GO


INSERT INTO NEA_Officer (OfficerName, OfficerContactNo, OfficerUsername, OfficerPasswordHashed, OfficerRoles, OfficerStatus) VALUES
('Officer John Doe', '61112222','John001','123','Health','Active'),
('Officer Jane Smith', '62223333','Jane002','12345678','Health','Active'),
('Officer Peter Parker', '63334444','Peter003','12345','Inspection','Suspended'),
('Officer Bruce Wayne', '64445555','Bruce004','Password','Compliance','Active'),
('Officer Clark Kent', '65556666','Clark005','Pa$$w0rd','Inspection','Active'),
('Officer Diana Prince', '66667777','Diana006','Password10','Enforcement','Inactive'),
('Officer Barry Allen', '67778888','Barry007','Barry','Enforcement','Inactive'),
('Officer Hal Jordan', '68889999','Hal008','Spain','Operations','Inactive'),
('Officer Arthur Curry', '69990000','Arthur009','admin','Operations','Resigned'),
('Officer Victor Stone', '60001111','Stone010','qwerty','Compliance','Active');