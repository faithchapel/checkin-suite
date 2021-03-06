USE [MinistryPlatform]
GO
/****** Object:  UserDefinedFunction [dbo].[fnParseString]    Script Date: 4/26/2016 11:17:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Kevin Hoffman
-- Create date: May 28, 2015
-- Description:	
-- =============================================
CREATE FUNCTION [dbo].[fnParseString] 
(	
	-- Add the parameters for the function here
	@StringList NVARCHAR(MAX), 
	@Delimiter CHAR(1)
)
RETURNS @TableList TABLE (ID int identity(1,1) PRIMARY KEY,[Substring] NVARCHAR(max))
BEGIN
      IF @StringList = '' RETURN
      DECLARE @XML xml
      SET @XML = '<root><csv>'+replace(@StringList,@Delimiter,'</csv><csv>')+
                 '</csv></root>'
      INSERT @TableList
      SELECT rtrim(ltrim(replace(Word.value('.','nvarchar(max)'),char(10),'')))
             AS ListMember
      FROM @XML.nodes('/root/csv') AS WordList(Word)
RETURN
END




