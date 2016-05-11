# Check-In Suite
This application interfaces with ministry platform to check people into events, create new families, and let families request their information to be updated.

# Configuration

### Service Reference
To configure the application, first open the Visual Studio project. 

Click Service References, Right Click mpapi, Click delete

Click Project->Add Service Reference.

Add your MP Soap API service URL in the Address field.

Add the name "mpapi" in the namespace field.

Click Ok.

### Environment Settings
In the CheckInSuite\Config directory open the Environment.config file.

Change the variables to reflect your API credentials and settings in your environment.


# Database Modifications

We added a few things to the existing ministry platform database for this application to use. For checkin-suite to work you will make these changes.

### Users
In the users table we added a Pin field. Simply add the following to the dp_Users table

| Field Title  | Field Type   | Relation                | Allow Null | Description  |
| ------------ | ------------ | ----------------------- | ---------- | ------------ |
|Pin           |int           |                         | True      | the override pin |

### Data Notes
We added a table called Data_Notes. Any data checkin adds/modifies will go in here for someone to review.

| Field Title  | Field Type   | Relation                | Allow Null | Description  |
| ------------ | ------------ | ----------------------- | ---------- | ------------ |
|DataNoteID    |int           |                         | False      | the foreign key |
|RelatedContact|int           |Contact_ID               | False      | the contact that this data note relates to |
|Header        |nvarchar(50)  |                         | True       | a basic generalization of what this note is about |
|Note          |nvarchar(MAX) |                         | True       | the information about this note |
|ContactPhone  |invarchar(13) |                         | True       | a phone number to call for questions |
|RecordedBy    |int           |User_ID                  | True       | who made this data note |
|Closed        |bit           |                         | True       | has this data note been followed up on |
|Domain_ID     |int           |                         | False      | the domain id |

### Stored Procedures and Functions
A stored procedure and function are located in the SQL folder of the project. Both of these need to be deployed to your SQL database for this project to function.

# Data Notes
Data notes are created when data is either modified or created. This allows for somone to review these changes to make sure there are no duplicates and everything is correct. 

### Types
There are a few different types of data notes

#### New Contact Created
Whenever checkinsuite creates a new contact and participant, this data notes is created

| Field | Description |
| ----- | ------------|
| RelatedContact | {the contactId that was created} |
| Header | "New Contact Created" |
| Note | "Contact and Participant created" |
| ContactPhone | null |

#### User Requested Change
When the user has edited a contact in their family these notes are created

| Field | Description |
| ----- | ------------|
| RelatedContact | {the contactId who wants to be edited} |
| Header | "User Requested Changed" |
| Note | {topic} [{topic text}: {users response}] |
| ContactPhone | {phone to contact} |

#### Existing Contact Added to Household
When a child that already exists is added to a family, this data note is created

| Field | Description |
| ----- | ------------|
| RelatedContact | {contactId of the child who was added to a household} |
| Header | "Existing Contact Added to Household" |
| Note | "A Contact_Household record was created to pair this contact to {householdId} household. If this is correct reassign this contact to the new household, otherwise change Other Household relationship to 'Guest' or 'Grandchild'." |
| ContactPhone | null |

#### Tag Override
This data note is created when a pin is used to manually check someone in

| Field | Description |
| ----- | ------------|
| RelatedContact | {contactId of who checked in} |
| Header | "Tag Override" |
| Note | "[Added To Group: {groupId}]" |
| ContactPhone | null |
| RecordedBy | {User_Id of whose pin was used} |


