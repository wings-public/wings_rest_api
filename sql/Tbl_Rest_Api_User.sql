CREATE TABLE Tbl_Rest_Api_User(
    UserID int NOT NULL PRIMARY KEY,
    TokenHash nvarchar(250) NULL,
    LastAccessTime datetime NULL,
    APIAccess int NULL,
    ValidToken int NULL
);

--- Including another column to track the Forgot Token attempts.
use WiNGS_Db_Dev
GO
ALTER TABLE dbo.Tbl_Rest_Api_User 
ADD ForgotToken int NULL;

--- Including default constraint
ALTER TABLE dbo.Tbl_Rest_Api_User 
ADD CONSTRAINT df_Forgot
DEFAULT 0 FOR ForgotToken; 