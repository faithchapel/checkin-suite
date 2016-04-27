using CheckinSuite.Exceptions;
using CheckinSuite.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Linq;
using System.Web;

namespace CheckinSuite
{
    public static class MinistryPlatform
    {

        static String apiGUID = ConfigurationManager.AppSettings["APIGUID"];
        static String apiPassword = ConfigurationManager.AppSettings["APIPassword"];
        static int userId = Convert.ToInt32(ConfigurationManager.AppSettings["FirstTimeCheckinUserID"]);

        static mpapi.apiSoapClient api = new mpapi.apiSoapClient();




        private static string formatName(string name){
            name = name.ToLower().Trim();
            return name.Substring(0, 1).ToUpper() + name.Substring(1);
        }

        public static void CreatePerson(HouseholdMember data)
        {
            // corrects case for first name and last name
            data.FirstName = formatName(data.FirstName);

            data.LastName = formatName(data.LastName);
            

            data.ContactId = CreateContact(data);
            data.ParticipantId = CreateParticipant(data);
            UpdateContact(data);
            CreateDataNote(data.ContactId.Value, "New Contact Created", "Contact and Participant created", "", ConfigurationManager.AppSettings["FirstTimeCheckinUserID"]);
        }

        public static int CreateHousehold(HouseholdMember contactData)
        {
            string requestString = "Household_Name=" + contactData.LastName +
                "&Congregation_ID=" + ConfigurationManager.AppSettings["CampusID"] + 
                "&Household_Source_ID=42";
            return Convert.ToInt32(AddInformationToDatabase(requestString, "Households", "Household_ID"));
        }

        public static int CreateHouseholdWithPhone(HouseholdMember member, string householdPhone)
        {
            member.LastName = formatName(member.LastName);

            string requestString = "Household_Name=" + member.LastName +
               "&Congregation_ID=" + ConfigurationManager.AppSettings["CampusID"] +
               "&Home_Phone=" + householdPhone +
               "&Household_Source_ID=42";

            return Convert.ToInt32(AddInformationToDatabase(requestString, "Households", "Household_ID"));
        }

        public static int CreateContact(HouseholdMember data)
        {
            if (!data.HouseholdId.HasValue)
            {
                throw new ArgumentException("Household ID required");
            }
            string requestString = "Display_Name=" + data.LastName + ", " + data.FirstName +
                "&First_Name=" + data.FirstName +
                "&Nickname=" + data.FirstName +
                "&Last_Name=" + data.LastName +
                "&Date_of_Birth=" + data.DateOfBirth +
                "&Gender_ID=" + data.Gender +
                "&Contact_Status=1" + // Active
                "&Bulk_Email_Opt_Out=0" +
                "&Household_ID=" + data.HouseholdId +
                "&Household_Position_ID=" + data.HouseholdPositionId +
                "&Company=0";

            return Convert.ToInt32(AddInformationToDatabase(requestString, "Contacts", "Contact_ID"));
        }

        public static int CreateParticipant(HouseholdMember contactData)
        {
            if (!contactData.ContactId.HasValue)
            {
                throw new ArgumentException("Contact ID required");
            }

            string requestString = "Contact_ID=" + contactData.ContactId +
                "&Participant_Type_ID=4" + // 4 = new
                "&Participant_Start_Date=" + DateTime.Now.ToString();

            return Convert.ToInt32(AddInformationToDatabase(requestString, "Participants", "Participant_ID"));
        }

        public static DataTable GetContact(HouseholdMember contactData)
        {
            return GetInformationFromDatabase("Task=GetContact&SearchString=" + contactData.FirstName + "&SearchStringB=" + contactData.LastName + "&SearchStringC=" + contactData.DateOfBirth);
        }

        public static DataTable GetGradeGroups()
        {
            return GetInformationFromDatabase("Task=GetGroups");
        }

        public static int CreateGroupParticipant(ChildHouseholdMember contactData)
        {
            string reqString = "Group_ID=" + contactData.Grade +
                "&Participant_ID=" + contactData.ParticipantId +
                "&Group_Role_ID=2" + // 2 = Participant
                "&Start_Date=" + DateTime.Now.ToString() +
                "&Employee_Role=0";

            return Convert.ToInt32(AddInformationToDatabase(reqString, "Group_Participants", "Group_Participant_ID"));
        }

        public static int CreateDataNote(int contactId, string noteTitle, string noteText, string contactPhone, string userID)
        {
            string requestString = "RelatedContact=" + contactId +
                "&Header=" + noteTitle +
                "&Note=" + noteText +
                "&ContactPhone=" + contactPhone +
                "&RecordedBy=" + userID +
                "&Closed=0";
            return Convert.ToInt32(AddInformationToDatabase(requestString, "Data_Notes", "Data_Note_ID"));
        }

        public static int CreateDataNote(DataNoteModel data)
        {
            string requestString = "RelatedContact=" + data.ContactId +
                "&Header=" + data.NoteTitle +
                "&Note=" + data.NoteText +
                "&ContactPhone=" + data.ContactPhone +
                "&RecordedBy=" + data.UserId +
                "&Closed=0";
            return Convert.ToInt32(AddInformationToDatabase(requestString, "Data_Notes", "Data_Note_ID"));
        }

        public static void UpdateContact(HouseholdMember contactData)
        {
            if (!contactData.ContactId.HasValue)
            {
                throw new ArgumentException("Contact ID not found");
            }

            string reqString = "Contact_ID=" + contactData.ContactId;
            if (contactData.HouseholdId.HasValue)
            {
                reqString += "&Household_ID=" + contactData.HouseholdId;
            }
            if (contactData.ParticipantId.HasValue)
            {
                reqString += "&Participant_ID=" + contactData.ParticipantId;
            }

            UpdateInformationInDatabase(reqString, "Contacts", "Contact_ID");
        }

        public static int CreateShowsInCheckinWithEndDate(ChildHouseholdMember contactData, int householdId)
        {
            DateTime now = DateTime.Now;
            now = now.AddDays(5);
            return createShowsInCheckin(contactData, householdId, now.ToString());
        }

        public static int CreateShowsInCheckin(ChildHouseholdMember contactData, int householdId)
        {
            return createShowsInCheckin(contactData, householdId, "");
        }

        private static int createShowsInCheckin(ChildHouseholdMember contactData, int householdId, string endDate)
        {
            string requestString = "Contact_ID=" + contactData.ContactId +
                "&Household_ID=" + householdId +
                "&Household_Position_ID=" + (int)contactData.Relation +
                "&Household_Type_ID=6" + // Shows in checkin
                "&End_Date=" + endDate;

            return Convert.ToInt32(AddInformationToDatabase(requestString, "Contact_Households", "Contact_Household_ID"));
        }

        public static DataTable GetHouseholdMatches(string phone)
        {
            return GetInformationFromDatabase("Task=GetHouseholdMatches&SearchString=" + phone);
        }

        public static DataTable GetActiveCheckinEvents(string programIds)
        {
            return GetInformationFromDatabase("Task=GetActiveCheckinEvents&SearchString=" + programIds + "&SearchID=" + ConfigurationManager.AppSettings["CampusID"]);
        }

        public static DataTable GetCheckInOptions(int householdId, string eventIds)
        {
            return GetInformationFromDatabase("Task=GetCheckInOptions&SearchID=" + householdId + "&SearchString=" + eventIds);
        }

        public static int CreateEventParticipant(ParticipatingHouseholdMemberModel householdMember)
        {
            string requestString = "Event_ID=" + householdMember.EventId +
                "&Participant_ID=" + householdMember.ParticipantId +
                "&Participation_Status_ID=3" + // 3 = attended
                "&Time_In=" + DateTime.Now + 
                "&Group_ID=" + householdMember.GroupId;

            if (householdMember.GroupParticipantId != 0){
                requestString += "&Group_Participant_ID=" + householdMember.GroupParticipantId;
               
            }
            if (householdMember.GroupRoleId != 0){
                requestString += "&Group_Rold_ID=" + householdMember.GroupRoleId;
            }

            return Convert.ToInt32(AddInformationToDatabase(requestString, "Event_Participants", "Event_Participant_ID"));
        }

        public static DataTable GetPrintingData(string eventParticiapntIds){

            return GetInformationFromDatabase("Task=GetTagsToPrint&SearchString=" + eventParticiapntIds);
        }

        public static DataTable GetOverrideEventList()
        {
            return GetInformationFromDatabase("Task=OverrideEventList");
        }

        public static DataRow GetContactFromContactId(int contactId)
        {
            return GetInformationFromDatabase("Task=GetContactFromId&SearchID=" + contactId).Rows[0];
        }

        public static DataRow ValidatePIN(string pin)
        {
            return GetInformationFromDatabase("Task=ValidatePIN&SearchID=" + pin).Rows[0];
        }
        
        public static DataTable GetGroupParticipant(int participantId, string groupId) {
            return GetInformationFromDatabase("Task=GetGroupParticipant&SearchID=" + participantId + "&SearchIDB=" + groupId);
        }

        // Used in initing of editHousehold.cshtml
        public static DataTable GetHouseholdContacts(int householdId)
        {
            return GetInformationFromDatabase("Task=GetHouseholdContacts&SearchID=" + householdId);
        }

        private static DataTable GetInformationFromDatabase(string requestString)
        {


            DataSet storedProcResult = api.ExecuteStoredProcedure(apiGUID, apiPassword, "api_Faith_CheckInSuite", requestString);

            DataTable dTable = storedProcResult.Tables[0];

            if (dTable.Rows.Count == 0)
            {
                throw new StoredProcReturnedEmptyException();
            }

            return dTable;
        }

        private static string AddInformationToDatabase(string requestString, string tableName, string primaryKeyField)
        {
            string retFromDatabase = api.AddRecord(apiGUID, apiPassword, userId, tableName, primaryKeyField, requestString);


            if (retFromDatabase.Split('|')[2] != "Create Successful")
            {
                throw new DatabaseUpdateRecordFailedException();
            }
            return retFromDatabase.Split('|')[0]; // <- needs to return because of finding new key added
        }


        private static void UpdateInformationInDatabase(string requestString, string tableName, string primaryKeyField)
        {
            
            string retFromDatabase = api.UpdateRecord(apiGUID, apiPassword, userId, tableName, primaryKeyField, requestString);

            if (retFromDatabase.Split('|')[2] != "Update Successful")
            {
                throw new DatabaseUpdateRecordFailedException();
            }
        }
    }
}