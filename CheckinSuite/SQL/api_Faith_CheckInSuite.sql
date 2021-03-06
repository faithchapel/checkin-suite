USE [MinistryPlatform]
GO
/****** Object:  StoredProcedure [dbo].[api_Faith_CheckInSuite]    Script Date: 5/6/2016 10:30:51 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Matthew Nitschke
-- Create date: Sep 15 2015
-- Description:	This stored proc is for the faith chapel first time checkin application
-- =============================================
ALTER PROCEDURE [dbo].[api_Faith_CheckInSuite]
	
	@DomainID int =0,
	@Task	varchar(50),
	@SearchID int = 0, -- SearchID
	@SearchIDB int = 0,
	@SearchString varchar(max) = '',
	@SearchStringB varchar(40) = '',
	@SearchStringC varchar(40) = ''

AS
BEGIN
	If @Task = 'GetContact'
	Begin
		SELECT        Contact_ID, Date_of_Birth, Household_ID, Participant_Record
		FROM            Contacts
		WHERE        (First_Name LIKE @SearchString OR Nickname LIKE @SearchString) AND (Last_Name LIKE @SearchStringB) AND (Date_of_Birth = @SearchStringC)
	End


	-- =================== Get Authorized User =======================
	--
	--	@SearchID = Household ID 
	--
	--	Returns a dataset of all contacts related to a household
	--	Included contacts associated with households via Contact_Household (other household) relationship
	--
	--	==============================================================

	If @Task = 'GetHouseholdContacts'
	Begin
		SELECT        Contacts.Contact_ID, Contacts.Nickname, Contacts.Last_Name, Contacts.Household_Position_ID, Contacts.Date_of_Birth, Household_Positions.Household_Position, Contacts.__Age, Suffixes.Suffix
		FROM            Contacts INNER JOIN
                         Households ON Contacts.Household_ID = Households.Household_ID INNER JOIN
                         Household_Positions ON Contacts.Household_Position_ID = Household_Positions.Household_Position_ID LEFT OUTER JOIN
                         Suffixes ON Contacts.Suffix_ID = Suffixes.Suffix_ID
		WHERE        (Households.Household_ID = @SearchID)
		

		UNION

		--	Add any children tied to the family through Shows in Check-in relationships
		SELECT        Contacts.Contact_ID, Contacts.Nickname, Contacts.Last_Name, Contact_Households.Household_Position_ID, Contacts.Date_of_Birth, Household_Positions.Household_Position, Contacts.__Age, 
                         Suffixes.Suffix
		FROM            Contact_Households INNER JOIN
                         Households ON Contact_Households.Household_ID = Households.Household_ID INNER JOIN
                         Household_Positions ON Contact_Households.Household_Position_ID = Household_Positions.Household_Position_ID INNER JOIN
                         Contacts ON Contact_Households.Contact_ID = Contacts.Contact_ID LEFT OUTER JOIN
                         Suffixes ON Contacts.Suffix_ID = Suffixes.Suffix_ID
		WHERE        (Contact_Households.Household_ID = @SearchID) AND (Contact_Households.Household_Type_ID = 6) AND (Contact_Households.Household_Position_ID IN (2, 5, 8)) AND 
                         (Contact_Households.End_Date IS NULL OR
                         Contact_Households.End_Date > GETDATE())
		ORDER BY Contacts.Household_Position_ID, Contacts.__Age

	End


	-- =================== Get Authorized User =======================
	--
	--	@SearchID = Pin entered by user
	--
	--	Returns a row with a userID and UserName matching the PIN entered.  
	--	If no row returned then PIN not on record
	--
	--	==============================================================

	If @Task = 'GetAuthorizedUser'
	Begin

		SELECT dp_Users.User_ID, dp_Users.User_Name, Contacts.Display_Name, dp_Users.PIN
		FROM  dp_Users INNER JOIN
		    Contacts ON dp_Users.Contact_ID = Contacts.Contact_ID
		WHERE dp_Users.PIN = @SearchID
	End


	-- =================== Get Groups ================================
	--
	--	Returns a list of Age / Grade Groups to use for checkin
	--
	--	==============================================================

	If @Task = 'GetGroups'
	Begin
		SELECT Groups.Group_ID, Groups.Group_Name, Group_Types.Group_Type, Groups.Group_Type_ID, Parent_Group.Group_Name AS Parent_Group_Name, Parent_Group.Group_ID AS Parent_Group_ID
		FROM  Groups INNER JOIN
				Group_Types ON Groups.Group_Type_ID = Group_Types.Group_Type_ID INNER JOIN
				Groups AS Parent_Group ON Groups.Parent_Group = Parent_Group.Group_ID INNER JOIN
				Groups AS GParent_Group ON Parent_Group.Parent_Group = GParent_Group.Group_ID
		WHERE (Groups.Group_Type_ID = 4) AND (GParent_Group.Group_ID=3575) AND (Groups.Congregation_ID = 1) AND NOT ((Parent_Group.Group_ID = 5844) OR (Parent_Group.Group_ID = 5986))
		ORDER BY Parent_Group.Sort_Order, Groups.Sort_Order
	End


	-- =================== Get Checkin Options ======================
	--
	-- @SearchID = HouseholdID
	-- @SearchString = EventID (can pass in multiple events separated with "-"
	--
	--	This will return check in options for the Household Event Combination.  
	--	At least one row will be returned for each person related to the household.  Multiple rows will be returned 
	--	when a person is in multiple groups associated with the event.
	--
	--	Takes into account program groups, groups associated directly with the event, primary household members, other household
	--	members (shows in check-in relationship), and Check-in settings.
	--
	--	Use Check_In_Closed to determine if the checkin window is closed.
	--	==============================================================

	If @Task = 'GetCheckInOptions'
	Begin

		SELECT Checkin_Options.Household_Position_ID, 
			Checkin_Options.Household_Position, 
			Checkin_Options.Contact_ID, 
			Checkin_Options.Display_Name, 
			Checkin_Options.Nickname, 
			Checkin_Options.Last_Name, 
			Checkin_Options.Participant_ID, 
			Checkin_Options.Group_ID, 
			Checkin_Options.Group_Name, 
			Checkin_Options.Event_ID, 
			Checkin_Options.Event_Title, 
			Checkin_Options.Event_Start_Date, 
			Checkin_Options.Event_End_Date, 
			Checkin_Options.Start_Checkin_Time, 
			Checkin_Options.Stop_Checkin_Time,
			Check_In_Closed, 
			Event_Participants.Event_Participant_ID, 
			Event_Participants.Time_In, 
			Event_Participants.Participation_Status_ID,
			Checkin_Options.Gender_ID,
			Checkin_Options.__Age,
			Checkin_Options.Group_Participant_ID,
			Checkin_Options.Group_Role_ID,
			Checkin_Options.Role_Title AS Group_Role_Title,
			Checkin_Options.Suffix
			
			

		FROM  Event_Participants RIGHT OUTER JOIN
             (SELECT        TOP (100) PERCENT Checkin_Households.Household_ID, Checkin_Households.Household_Name, Checkin_Households.Household_Position_ID, Checkin_Households.Household_Position, 
                         Checkin_Households.Contact_ID, Checkin_Households.Display_Name, Checkin_Households.Nickname, Checkin_Households.Last_Name, Checkin_Households.Participant_ID, Groups.Group_ID, 
                         Groups.Group_Name, Current_Event_Groups.Event_ID, Current_Event_Groups.Event_Title, Current_Event_Groups.Event_Start_Date, Current_Event_Groups.Event_End_Date, DATEADD(MINUTE, 
                         Current_Event_Groups.[Early_Check-in_Period] * - 1, Current_Event_Groups.Event_Start_Date) AS Start_Checkin_Time, DATEADD(MINUTE, Current_Event_Groups.[Late_Check-in_Period], 
                         Current_Event_Groups.Event_Start_Date) AS Stop_Checkin_Time, CASE WHEN GetDate() NOT BETWEEN DATEADD(MINUTE, Current_Event_Groups.[Early_Check-in_Period] * - 1, 
                         Current_Event_Groups.Event_Start_Date) AND DATEADD(MINUTE, Current_Event_Groups.[Late_Check-in_Period], Current_Event_Groups.Event_Start_Date) THEN 1 ELSE 0 END AS Check_In_Closed, 
                         Checkin_Households.Gender_ID, Checkin_Households.__Age, Current_Group_Participants.Group_Participant_ID, Current_Group_Participants.Group_Role_ID, Checkin_Households.Suffix, 
                         Group_Roles.Role_Title
				FROM            Group_Roles RIGHT OUTER JOIN
						(
							
							
							SELECT        Group_Participant_ID, Group_ID, Participant_ID, Start_Date, End_Date, Group_Role_ID
							FROM            Group_Participants AS Group_Participants_1
							WHERE        (End_Date IS NULL) OR
                                                         (End_Date >= GETDATE()) AND (Start_Date <= GETDATE())) AS Current_Group_Participants INNER JOIN
								(
									-- Program Groups for List of requested events
									SELECT        Events_2.Event_ID, Events_2.Event_Title, Events_2.Event_Start_Date, Events_2.Event_End_Date, Events_2.[Allow_Check-in], Events_2.Ignore_Program_Groups, Events_2.Prohibit_Guests, 
                                               Events_2.[Early_Check-in_Period], Events_2.[Late_Check-in_Period], Program_Groups_1.Group_ID, Groups_2.Group_Name
                                 FROM          Events AS Events_2 INNER JOIN
                                               Programs AS Programs_1 ON Events_2.Program_ID = Programs_1.Program_ID INNER JOIN
                                                         Program_Groups AS Program_Groups_1 ON Programs_1.Program_ID = Program_Groups_1.Program_ID INNER JOIN
                                                             (SELECT        ID, Substring
                                                               FROM            dbo.fnParseString(@SearchString, '-') AS fnParseString_1) AS Desired_Events_1 ON Events_2.Event_ID = Desired_Events_1.Substring INNER JOIN
                                                         Groups AS Groups_2 ON Program_Groups_1.Group_ID = Groups_2.Group_ID
								 WHERE        (Events_2.[Allow_Check-in] = 1) AND (Events_2.Ignore_Program_Groups = 0) AND (Program_Groups_1.End_Date IS NULL OR
                                                         Program_Groups_1.End_Date >= GETDATE())
								
								UNION
									-- Groups associated directly with event
								SELECT        Events_1.Event_ID, Events_1.Event_Title, Events_1.Event_Start_Date, Events_1.Event_End_Date, Events_1.[Allow_Check-in], Events_1.Ignore_Program_Groups, Events_1.Prohibit_Guests, 
                                                        Events_1.[Early_Check-in_Period], Events_1.[Late_Check-in_Period], Event_Groups.Group_ID, Groups_1.Group_Name
								FROM            Events AS Events_1 INNER JOIN
                                                        Event_Groups ON Events_1.Event_ID = Event_Groups.Event_ID INNER JOIN
                                                        Groups AS Groups_1 ON Event_Groups.Group_ID = Groups_1.Group_ID INNER JOIN
                                                            (SELECT        ID, Substring
                                                              FROM            dbo.fnParseString(@SearchString, '-') AS fnParseString_1) AS Desired_Groups ON Events_1.Event_ID = Desired_Groups.Substring
                               WHERE        (Events_1.[Allow_Check-in] = 1) AND (Event_Groups.End_Date IS NULL)) AS Current_Event_Groups ON Current_Group_Participants.Group_ID = Current_Event_Groups.Group_ID INNER JOIN
                         Groups ON Current_Event_Groups.Group_ID = Groups.Group_ID ON Group_Roles.Group_Role_ID = Current_Group_Participants.Group_Role_ID RIGHT OUTER JOIN
                             (
								-- People in Primary Household
								SELECT        Households_2.Household_ID, Households_2.Household_Name, Contacts_2.Contact_ID, Contacts_2.Display_Name, Contacts_2.Nickname, Contacts_2.Last_Name, Contacts_2.Date_of_Birth, 
                                                         Contacts_2.Household_Position_ID, Participants_2.Participant_ID, Household_Positions.Household_Position, Contacts_2.Gender_ID, Contacts_2.__Age, Suffixes.Suffix
								FROM            Contacts AS Contacts_2 INNER JOIN
                                                         Participants AS Participants_2 ON Contacts_2.Contact_ID = Participants_2.Contact_ID INNER JOIN
                                                         Households AS Households_2 ON Contacts_2.Household_ID = Households_2.Household_ID INNER JOIN
                                                         Household_Positions ON Contacts_2.Household_Position_ID = Household_Positions.Household_Position_ID LEFT OUTER JOIN
                                                         Suffixes ON Contacts_2.Suffix_ID = Suffixes.Suffix_ID
								UNION
							   
							   -- Add People with Checkin Household relationship
                               SELECT        Households_1.Household_ID, Households_1.Household_Name, Contacts_1.Contact_ID, Contacts_1.Display_Name, Contacts_1.Nickname, Contacts_1.Last_Name, Contacts_1.Date_of_Birth, 
                                                        Contact_Households.Household_Position_ID, Participants_1.Participant_ID, Household_Positions_1.Household_Position, Contacts_1.Gender_ID, Contacts_1.__Age, Suffixes_1.Suffix
                               FROM            Participants AS Participants_1 INNER JOIN
                                                        Households AS Households_1 INNER JOIN
                                                        Contact_Households ON Households_1.Household_ID = Contact_Households.Household_ID INNER JOIN
                                                        Contacts AS Contacts_1 ON Contact_Households.Contact_ID = Contacts_1.Contact_ID ON Participants_1.Participant_ID = Contacts_1.Participant_Record INNER JOIN
                                                        Household_Positions AS Household_Positions_1 ON Contact_Households.Household_Position_ID = Household_Positions_1.Household_Position_ID LEFT OUTER JOIN
                                                        Suffixes AS Suffixes_1 ON Contacts_1.Suffix_ID = Suffixes_1.Suffix_ID
                               WHERE        (Contact_Households.End_Date IS NULL) OR
                                                        (Contact_Households.End_Date > GETDATE())) AS Checkin_Households ON Current_Group_Participants.Participant_ID = Checkin_Households.Participant_ID FULL OUTER JOIN
                         Groups AS Parent_Groups ON Groups.Parent_Group = Parent_Groups.Group_ID FULL OUTER JOIN
                         Groups AS GrandParent_Groups ON Parent_Groups.Parent_Group = GrandParent_Groups.Group_ID
						WHERE        (Checkin_Households.Household_ID = @SearchID)) AS Checkin_Options ON Event_Participants.Event_ID = Checkin_Options.Event_ID AND Event_Participants.Group_ID = Checkin_Options.Group_ID AND 
					Event_Participants.Participant_ID = Checkin_Options.Participant_ID
			WHERE Event_Participants.Participation_Status_ID = 3 OR (Event_Participants.Participation_Status_ID IS NULL)
			ORDER BY Checkin_Options.Household_Position_ID, Checkin_Options.__Age
	End



	-- =================== Get Checkin Events ================
	--
	-- @SearchID = CongregationID (Campus)
	-- @SearchString = ProgramID (can pass in multiple programs separated with "-"
	--
	-- Will return a list of Events that allow checkin and who have
	-- a check-in window that lines up with the current time
	--
	-- ===========================================================

	IF @Task = 'GetActiveCheckinEvents'
	Begin
		SELECT Events.Event_ID, Events.Event_Title, Events.Congregation_ID, Congregations.Congregation_Name, Events.Program_ID, Programs.Program_Name, Events.Event_Start_Date, Events.Event_End_Date, Events.[Allow_Check-in], Events.[Early_Check-in_Period], Events.[Late_Check-in_Period]
		FROM  Events INNER JOIN
			Congregations ON Events.Congregation_ID = Congregations.Congregation_ID INNER JOIN
			Programs ON Events.Program_ID = Programs.Program_ID INNER JOIN
             (	SELECT ID, Substring
				FROM  dbo.fnParseString(@SearchString, '-') AS fnParseString_1) AS Desired_Programs ON Programs.Program_ID = Desired_Programs.Substring
		WHERE	(Events.[Allow_Check-in] = 1) AND 
				(DATEADD(MINUTE, Events.[Early_Check-in_Period] * - 1, Events.Event_Start_Date) < GETDATE()) AND 
				(DATEADD(MINUTE, Events.[Late_Check-in_Period], Events.Event_Start_Date) > GETDATE()) AND 
				(Events.Congregation_ID = @SearchID) AND
				Events.Cancelled = 0
								
	End



	-- =================== Get Tags to Print ================
	--
	-- @SearchString = EventParticipantID (can pass in multiple programs separated with "-"
	--
	--	Returns information to print on tags.  
	--	IMPORTANT - there can be multiple rows per participant.  Each parent name is returned on a separate row - tag printing application should 
	--	itterate through rows and concatinate parent names into a single string
	--
	--	Up to 3 tags will print per Event Participant
	--	Tag #1 = Name Tag 
	--	Tag #2 = Classroom Tag (Secure_Check-in = True)
	--	Tag #3 = Parent Pickup Tag (Suppress_Parent_Tag = False)
	--
	--	Suppress_Care_Note = True - Do not show Allergies Field on Name & Classroom Tags
	-- ===========================================================

	If @Task = 'GetTagsToPrint'
	Begin
		SELECT        Event_Participants.Event_Participant_ID, Contacts.Contact_ID, Contacts.Nickname, Contacts.Last_Name, Event_Participants.Time_In, Groups.Group_ID, Groups.Group_Name, Groups.[Secure_Check-in], 
                         Groups.Suppress_Nametag AS Supress_Parent_Tag, Groups.Suppress_Care_Note, Group_Roles.Role_Title, Allergies.AllergyNote AS Allergies, guardians.Nickname AS GuardianName, guardians.Gender_ID, 
                         Events.Event_ID, Events.Event_Title, Times_Attended.Number_of_Times_Attended
		FROM            Event_Participants INNER JOIN
                         Participants ON Event_Participants.Participant_ID = Participants.Participant_ID INNER JOIN
                         Contacts ON Participants.Contact_ID = Contacts.Contact_ID INNER JOIN
                         Events ON Event_Participants.Event_ID = Events.Event_ID INNER JOIN
                             (SELECT        ID, Substring
                               FROM            dbo.fnParseString(@SearchString, '-') AS fnParseString_1) AS Desired_Event_Participants ON Event_Participants.Event_Participant_ID = Desired_Event_Participants.Substring LEFT OUTER JOIN
                             (SELECT        Participant_ID, COUNT(Event_Participant_ID) AS Number_of_Times_Attended
                               FROM            Event_Participants AS Event_Participants_1
                               GROUP BY Participant_ID) AS Times_Attended ON Participants.Participant_ID = Times_Attended.Participant_ID LEFT OUTER JOIN
                             (SELECT        TOP (100) PERCENT Household_ID, Contact_ID, Nickname, Gender_ID, Date_of_Birth
                               FROM            Contacts AS Contacts_1
                               WHERE        (Household_Position_ID = 1)
                               ORDER BY Gender_ID DESC, Date_of_Birth) AS guardians ON Contacts.Household_ID = guardians.Household_ID LEFT OUTER JOIN
                             (SELECT        Contact_ID, MAX(Notes) AS AllergyNote
                               FROM            Contact_Attributes
                               WHERE        (Attribute_ID = 1) AND (End_Date > GETDATE() OR
                                                         End_Date IS NULL)
                               GROUP BY Contact_ID) AS Allergies ON Contacts.Contact_ID = Allergies.Contact_ID LEFT OUTER JOIN
                         Group_Roles ON Event_Participants.Group_Role_ID = Group_Roles.Group_Role_ID LEFT OUTER JOIN
                         Groups ON Event_Participants.Group_ID = Groups.Group_ID
			ORDER BY Contacts.Gender_ID






	END



	-- =================== Get Household Matches ================
	--
	-- @SearchString = String User Searches By
	--
	--	Matches against HomePhone(Household), MobilePhone(Contact), CompanyPhone(Contact) OR 
	--	Matches against Partial Last AND First or Nickname separated by ','
	--
	--	Any match to a contact will return the household
	--
	-- ==========================================================

	IF @Task = 'GetHouseholdMatches'

	Begin
		IF CHARINDEX(',',@SearchString) = 0 -- Searching by Phone (',' only used in name searches)
		BEGIN

			SET @SearchString = REPLACE(@SearchString,'-','') -- Strip any '-' out of phone number
			SET @SearchString = REPLACE(@SearchString,'(','') -- Strip any '(' out of phone number
			SET @SearchString = REPLACE(@SearchString,')','') -- Strip any '(' out of phone number			
			

			IF	LEN(@SearchString) > 4 AND LEN(@SearchString) <=7 -- Have a phone number with 4 plus at least a partial prefix
				BEGIN
					SET @SearchString = LEFT(@SearchString,(LEN(@SearchString)-4)) + '-' + RIGHT(@SearchString,4)
				END	
			ELSE IF LEN(@SearchString) > 7						-- Have full phone number with at leas a partial area code
				BEGIN
					SET @SearchString = LEFT(@SearchString,(LEN(@SearchString)-7)) + '-' + LEFT(RIGHT(@SearchString,7),3) + '-' + Right(@SearchString,4)
				END
			-- ELSE we hav less than 4 digits no formatting necessary.

			

			SELECT DISTINCT Household_ID, Household_Name
			FROM  (SELECT	Households.Household_ID, Households.Household_Name, Households.Home_Phone, Contacts.Contact_ID, Contacts.Display_Name, Contacts.Nickname, Contacts.First_Name, Contacts.Last_Name, Contacts.Mobile_Phone, Households.Home_Phone AS Clean_Household_Phone, 
							Contacts.Mobile_Phone	AS Clean_Mobile_Phone, Contacts.Company_Phone AS Clean_Company_Phone
					FROM	Households LEFT OUTER JOIN
							Contacts ON Households.Household_ID = Contacts.Household_ID
					UNION
					SELECT	Households_1.Household_ID, Households_1.Household_Name, Households_1.Home_Phone, Contact_Households.Contact_ID, Contacts_1.Display_Name, Contacts_1.Nickname, Contacts_1.First_Name, Contacts_1.Last_Name, Contacts_1.Mobile_Phone, Households_1.Home_Phone AS Clean_Household_Phone, 
							Contacts_1.Mobile_Phone AS Clean_Mobile_Phone, Contacts_1.Company_Phone AS Clean_Company_Phone
					FROM	Contact_Households INNER JOIN
							Contacts AS Contacts_1 ON Contact_Households.Contact_ID = Contacts_1.Contact_ID INNER JOIN
							Households AS Households_1 ON Contact_Households.Household_ID = Households_1.Household_ID
					) AS Complete_Households
			WHERE 	Clean_Household_Phone LIKE '%' + @SearchString + '%' OR		-- Match Household Phone
					Clean_Mobile_Phone LIKE '%' + @SearchString + '%' OR		-- Match Mobile Phone
					Clean_Company_Phone LIKE '%' + @SearchString + '%'			-- Match Company Phone

		END -- END IF Searching by Phone	


		IF CHARINDEX(',',@SearchString) > 0		-- ELSE ARE Searching by Name
		BEGIN	
		 
			SELECT DISTINCT Household_ID, Household_Name
			FROM  (SELECT	Households.Household_ID, Households.Household_Name, Households.Home_Phone, Contacts.Contact_ID, Contacts.Display_Name, Contacts.Nickname, Contacts.First_Name, Contacts.Last_Name, Contacts.Mobile_Phone, REPLACE(Households.Home_Phone, '-', '') AS Clean_Household_Phone, REPLACE(Contacts.Mobile_Phone, '-', '') 
							AS Clean_Mobile_Phone, REPLACE(Contacts.Company_Phone, '-', '') AS Clean_Company_Phone
					FROM	Households LEFT OUTER JOIN
							Contacts ON Households.Household_ID = Contacts.Household_ID
					UNION
					SELECT Households_1.Household_ID, Households_1.Household_Name, Households_1.Home_Phone, Contact_Households.Contact_ID, Contacts_1.Display_Name, Contacts_1.Nickname, Contacts_1.First_Name, Contacts_1.Last_Name, Contacts_1.Mobile_Phone, REPLACE(Households_1.Home_Phone, '-', '') AS Clean_Household_Phone, 
							REPLACE(Contacts_1.Mobile_Phone, '-', '') AS Clean_Mobile_Phone, REPLACE(Contacts_1.Company_Phone, '-', '') AS Clean_Company_Phone
					FROM	Contact_Households INNER JOIN
							Contacts AS Contacts_1 ON Contact_Households.Contact_ID = Contacts_1.Contact_ID INNER JOIN
							Households AS Households_1 ON Contact_Households.Household_ID = Households_1.Household_ID
					WHERE	(Contact_Households.End_Date IS NULL OR Contact_Households.End_Date > GetDate())
					) AS Complete_Households
			WHERE
				(
					Last_Name LIKE LEFT(@SearchString,CHARINDEX(',',@SearchString)-1) + '%' AND	 
					(
						First_Name LIKE LTRIM(RIGHT(@SearchString,LEN(@SearchString)-CHARINDEX(',',@SearchString))) +'%' OR 
						Nickname LIKE LTRIM(RIGHT(@SearchString,LEN(@SearchString)-CHARINDEX(',',@SearchString))) +'%' 
					)
				)
		END -- END IF Searching by Name	
	End


	-- =================== Validate PIN ================
	--
	-- @SearchString = PIN
	--
	--	Returns a Contact ID if the PIN entered matches a user
	--
	-- =================================================

	If @Task = 'ValidatePIN'
	Begin
		SELECT        dp_Users.User_ID, dp_Users.User_Name, Contacts.Contact_ID, Contacts.Display_Name
		FROM            dp_Users INNER JOIN
                         Contacts ON dp_Users.Contact_ID = Contacts.Contact_ID
		WHERE		dp_Users.PIN = @SearchID
	End


	-- =================== Override Events List ================
	--
	-- Will return a list of Events that allow checkin and that 
	-- are live events at the current time
	--
	-- ===========================================================

	IF @Task = 'OverrideEventList'
	Begin
		SELECT        Events.Event_ID, Events.Event_Title, Events.Congregation_ID, Congregations.Congregation_Name, Events.Program_ID, Programs.Program_Name, Events.Event_Start_Date, Events.Event_End_Date, 
                         Events.[Allow_Check-in], Events.[Early_Check-in_Period], Events.[Late_Check-in_Period]
		FROM            Events INNER JOIN
                         Congregations ON Events.Congregation_ID = Congregations.Congregation_ID INNER JOIN
                         Programs ON Events.Program_ID = Programs.Program_ID
		WHERE        (Events.[Allow_Check-in] = 1) AND (DATEADD(MINUTE, - 120, Events.Event_Start_Date)<GETDATE()) AND (Events.Event_End_Date > GETDATE()) 				
	End

	IF @Task = 'GetContactFromId'
	Begin
		SELECT        Contact_ID, Participant_Record
		FROM            Contacts
		WHERE Contact_ID = @SearchID
	End


	-- =================== Get Duplicate Group Participant ================
	--
	-- Searches for duplicate records in group participants
	--
	-- SearchID - Participant ID
	-- SearchIDB - Group Pariciptant Id
	-- ===========================================================

	IF @Task = 'GetGroupParticipant'
	Begin
		SELECT        Participant_ID
		FROM            Group_Participants
		WHERE Participant_ID = @SearchID AND Group_ID = @SearchIDB
	End

	IF @Task = 'GetHouseholdName'
	Begin
		SELECT        Household_Name
FROM            Households
WHERE Household_ID = @SearchID
	End

END
