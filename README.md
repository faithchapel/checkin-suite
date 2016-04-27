# Checkin-Suite

# Database Modifications

We added a few things to the exsisting ministry platform database for this application to use. For checkin-suite to work you will make these changes.

## Users
In the users table we added a Pin field. Simply add an nullable integer field called Pin to the dp_Users table

## Data Notes
We added a table called Data_Notes. Any data checkin adds/modifies will go in here for someone to review.

| Field Title  | Field Type   | Relation                | Allow Null | 
| ------------ | ------------ | ----------------------- | ---------- |
|DataNoteID    |int           |                         | False      |
|RelatedContact|int           |Contacts -> Contact_ID   | False      |
|Header        |nvarchar(50)  |                         | True       |
|Note          |nvarchar(MAX) |                         | True       |
|ContactPhone  |invarchar(13) |                         | True       |
|RecordedBy    |int           |dp_Users -> User_ID      | True       |
|Closed        |bit           |                         | True       |
|Domain_ID     |int           |                         | False      |

