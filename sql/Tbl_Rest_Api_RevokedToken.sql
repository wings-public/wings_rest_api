use WiNGS_Db_Dev
GO 
CREATE TABLE Tbl_Rest_Api_RevokedToken(
    id int NOT NULL IDENTITY(1,1) PRIMARY KEY,
    UserID int  NOT NULL ,
    TokenHash nvarchar(250) NULL,
	AccessTime datetime NULL
);




