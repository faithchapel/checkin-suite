# Check-In Suite
This application interfaces with ministry platform to check people into events, create new families, and let families request their information to be updated.

# Database Modifications

We added a few things to the exsisting ministry platform database for this application to use. For checkin-suite to work you will make these changes.

### Users
In the users table we added a Pin field. Simply add an nullable integer field called Pin to the dp_Users table

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

#### Exsisting Contact Added to Household
When a child that already exsists is added to a family, this data note is created

| Field | Description |
| ----- | ------------|
| RelatedContact | {contactId of the child who was added to a household} |
| Header | "Exsisting Contact Added to Household" |
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
