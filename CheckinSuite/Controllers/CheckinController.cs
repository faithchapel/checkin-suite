using CheckinSuite.Exceptions;
using CheckinSuite.JsonObjects;
using CheckinSuite.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace CheckinSuite.Controllers
{
    public class CheckinController : Controller
    {

        public ActionResult Setup()
        {
            return View();
        }

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult ViewHouseholds()
        {
            return View();
        }

        public ActionResult Submit(List<ParticipatingHouseholdMemberModel> householdMembers)
        {
            JsonResponse response = new JsonResponse();

            List<string> eventParticipantIds = new List<string>();

            foreach (ParticipatingHouseholdMemberModel member in householdMembers)
            {
                eventParticipantIds.Add(MinistryPlatform.CreateEventParticipant(member).ToString());
            }

            string ids = string.Join("-", eventParticipantIds.ToArray());
            response.Add("eventParticipantIds", ids);

            return Content(response.serialize(), "application/json");
        }

        public ActionResult GetHouseholds()
        {
            JsonResponse response = new JsonResponse();
            string phone = Request["phone"];
            try
            {
                response.Add("households", JsonParser.Table(MinistryPlatform.GetHouseholdMatches(phone)));
            }
            catch (StoredProcReturnedEmptyException)
            {
                response.isSuccess = false;
                response.errorText = "No households found, Please try again (Note: if searching by name use the formal 'last name, first name')";
            }
            

            return Content(response.serialize(), "application/json");
        }

        public ActionResult GetActiveCheckinEvents()
        {
            JsonResponse response = new JsonResponse();
            string programIds = Request["programIds"];

            try
            {
                response.Add("activeEvents", JsonParser.Table(MinistryPlatform.GetActiveCheckinEvents(programIds)));
            }
            catch (StoredProcReturnedEmptyException)
            {
                response.isSuccess = false;
                response.errorText = "No active events found";
            }

            return Content(response.serialize(), "application/json");

        }

        public ActionResult GetCheckInOptions()
        {
            
            JsonResponse response = new JsonResponse();

            int householdId = Convert.ToInt32(Request["householdId"]);
            string eventIds = Request["eventIds"];

            try
            {
                DataTable data = MinistryPlatform.GetCheckInOptions(householdId, eventIds);

                response.Add("householdMembers", organizePeople(data));

            }
            catch (StoredProcReturnedEmptyException)
            {
                response.isSuccess = false;
                response.errorText = "proc returned empty";
            }

            return Content(response.serialize(), "application/json");
        }

        private List<Person> organizePeople(DataTable data)
        {
            List<Person> people = new List<Person>();
            string currentContactId = null;
            foreach (DataRow row in data.Rows)
            {
                if (currentContactId != row["Contact_ID"].ToString())
                {
                    currentContactId = row["Contact_ID"].ToString();
                    people.Add(new Person(currentContactId, data));
                }
            }
            return people;
        }

        public ActionResult ManualTagPrintSubmit()
        {
            JsonResponse response = new JsonResponse();

            String note = Request["note"];
            String userId = Request["userId"];
            int contactId = Convert.ToInt32(Request["contactId"]);

            ParticipatingHouseholdMemberModel model = new ParticipatingHouseholdMemberModel();
            model.EventId = Convert.ToInt32(Request["eventId"]);
            model.GroupId = Convert.ToInt32(Request["groupId"]);

            bool createGroupParticipant = Convert.ToBoolean(Request["createGroupParticipant"]);

            DataRow contactData = MinistryPlatform.GetContactFromContactId(contactId);
            if (Convert.IsDBNull(contactData["Participant_Record"]))
            {
                // make participant Id
                HouseholdMember member = new HouseholdMember();
                member.ContactId = Convert.ToInt32(contactId);
                model.ParticipantId = MinistryPlatform.CreateParticipant(member);
            }
            else
            {
                model.ParticipantId = Convert.ToInt32(contactData["Participant_Record"]);
            }

            if (createGroupParticipant)
            {
                ChildHouseholdMember chm = new ChildHouseholdMember();
                chm.Grade = model.GroupId.ToString();
                chm.ParticipantId = model.ParticipantId;
                int groupParticipantId = MinistryPlatform.CreateGroupParticipant(chm);
                note = "[Added To Group: " + model.GroupId + "] " + note;

            }

            int eventParticipantId = MinistryPlatform.CreateEventParticipant(model);

            MinistryPlatform.CreateDataNote(contactId, "Tag Override", note, "", userId);

            response.Add("eventParticipantId", eventParticipantId);

            return Content(response.serialize(), "application/json");
        }

        

        public ActionResult GetOverrideEventList()
        {
            JsonResponse response = new JsonResponse();
            try
            {
                DataTable table = MinistryPlatform.GetOverrideEventList();

                List<LightboxSelectItem> events = new List<LightboxSelectItem>();

                foreach (DataRow row in table.Rows)
                {
                    LightboxSelectItem addingItem = new LightboxSelectItem();
                    addingItem.title = row["Event_Title"].ToString();
                    addingItem.value = row["Event_ID"].ToString();
                    events.Add(addingItem);
                }

                response.Add("events", events);
                response.Add("eventData", JsonParser.Table(table));
            }
            catch (StoredProcReturnedEmptyException)
            {

            }


            return Content(response.serialize(), "application/json");
        }
    }

    public class Person
    {
        public string nickname;
        public string lastName;
        public string participantId;
        public string contactId;
        public string householdPositionId;

        public string groupParticipantId;
        public string groupRoleId;

        public bool isAlreadyCheckedIn;

        public List<Event> events = new List<Event>();

        public Person(string contactId, DataTable data)
        {
            DataView dv = data.DefaultView;

            contactId = contactId.Replace("'", "''"); // solves issue with ' in nickname. Sql turns '' into '

            dv.RowFilter = "Contact_ID = '" + contactId + "'";
            data = dv.ToTable();

            this.nickname = data.Rows[0]["Nickname"].ToString() + " " + data.Rows[0]["Suffix"].ToString();
            this.lastName = data.Rows[0]["Last_Name"].ToString();
            this.participantId = data.Rows[0]["Participant_ID"].ToString();
            this.contactId = data.Rows[0]["Contact_ID"].ToString();
            this.householdPositionId = data.Rows[0]["Household_Position_ID"].ToString();

            this.groupParticipantId = data.Rows[0]["Group_Participant_ID"].ToString();
            this.groupRoleId = data.Rows[0]["Group_Role_ID"].ToString();

            if (Convert.IsDBNull(data.Rows[0]["Event_Participant_ID"]))
            {
                this.isAlreadyCheckedIn = false;
            }
            else
            {
                this.isAlreadyCheckedIn = true;
            }
            
            foreach (DataRow row in data.Rows)
            {
                if (!Convert.IsDBNull(row["Event_ID"]))
                {
                    events.Add(new Event(row));
                }
            }
            
        }
    }
    public class Event
    {
        public string eventId;
        public string eventTitle;
        public string groupName;
        public string groupId;
        public bool checkinClosed;
        public string groupRoleTitle;

        public Event(DataRow data)
        {
            this.eventId = data["Event_ID"].ToString();
            this.eventTitle = data["Event_Title"].ToString();
            this.groupName = data["Group_Name"].ToString();
            this.groupId = data["Group_Id"].ToString();
            this.groupRoleTitle = data["Group_Role_Title"].ToString();

            if (data["Check_In_Closed"].ToString() == "1")
            {
                this.checkinClosed = true;
            }
            else
            {
                this.checkinClosed = false;
            }
            
        }
    }
}
