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
|DataNoteID    |int           |                         | False      | the primary key |
|RelatedContact|int           |Contact_ID               | False      | the contact that this data note relates to |
|Data_Note_Type_ID|int        |Data_Note_Type_ID        | True       | a reference to what kind of data note this is |
|Note          |nvarchar(MAX) |                         | True       | the information about this note |
|ContactPhone  |invarchar(13) |                         | True       | a phone number to call for questions |
|RecordedBy    |int           |User_ID                  | True       | who made this data note |
|Data_Note_Status_ID|int      |                         | True       | the current status of this data note |
|Domain_ID     |int           |                         | False      | the domain id |

### Data Note Types
This table called Data_Note_Types organizes the different types of data notes

| Field Title                | Field Type  | Relation                | Allow Null | Description  |
| -------------------------- | ----------- | ----------------------- | ---------- | ------------ |
| Data_Note_Type_ID          | int         |                         | False      |              |
| Data_Note_Type             | varchar(50) |                         | False      | The title of this data note |
| Data_Note_Type_Description | int         |                         | False      |  What this data note means |
| Domain_ID                  | int         |                         | False      | the domain id |

####Rows
You must add these to the Data_Note_Types Table

| Data_Note_Type_ID | Data_Note_Type |
| ----------------- | -------------- |
|         1         | New Person Created    |
|         2         | New Person + Household Created |
|         3         | Existing Adult Request to Be Added to Household |
|         4         | Existing Child Added to Household |
|         5         | Check-In Override  |
|         6         | User Requested Change |



### Data Note Statuses
This table called Data_Note_Statuses has different states data notes can be in

| Field Title  | Field Type   | Relation                | Allow Null | Description  |
| ------------ | ------------ | ----------------------- | ---------- | ------------ |
| Data_Note_Status_ID | int   |                         | False      |              |
| Status | varchar(50)        |                         | true       | Current status of this note |
|Domain_ID     |int           |                         | False      | the domain id |

#### Rows
You must add these to the Data_Note_Statuses table

| Data_Note_Status_ID  | Status |
| -------------------- | ------ |
|         1            | New    |
|          2           | Waiting For Information |
|         3            | Closed           |

### Stored Procedures and Functions
A stored procedure and function are located in the SQL folder of the project. Both of these need to be deployed to your SQL database for this project to function.


