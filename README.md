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

