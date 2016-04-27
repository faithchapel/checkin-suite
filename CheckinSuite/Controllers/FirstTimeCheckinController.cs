using CheckinSuite.Exceptions;
using CheckinSuite.JsonObjects;
using CheckinSuite.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Diagnostics;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace CheckinSuite.Controllers
{
    public class FirstTimeCheckinController : Controller
    {

        // Pages
        public ActionResult Setup()
        {
            return View();
        }
        
        public ActionResult Index()
        {
            ViewBag.AdultAge = ConfigurationManager.AppSettings["AdultAge"];
            return View();
        }

        public ActionResult EditHousehold(int id)
        {
            ViewBag.householdId = id;
            return View();
        }

        // Ajax pages
        public ActionResult CreatePerson(HouseholdModel data)
        {
            JsonResponse response = new JsonResponse();

            if (data.Children != null && data.Children.Count == 1)
            {
                ChildHouseholdMember child = data.Children[0];
                child.HouseholdPositionId = 2; // minor child
                child.HouseholdId = MinistryPlatform.CreateHouseholdWithPhone(child, data.HouseholdPhone);
                MinistryPlatform.CreatePerson(child);
                MinistryPlatform.CreateGroupParticipant(child);
                response.Add("householdId", child.HouseholdId);
            }
            else if (data.Adults != null && data.Adults.Count == 1)
            {
                HouseholdMember adult = data.Adults[0];
                adult.HouseholdPositionId = 1; // head of household
                adult.HouseholdId = MinistryPlatform.CreateHouseholdWithPhone(adult, data.HouseholdPhone);
                MinistryPlatform.CreatePerson(adult);
                response.Add("householdId", adult.HouseholdId);
            }
            else
            {
                response.isSuccess = false;
                response.errorText = "multiple people passed in";
            }

            return Content(response.serialize(), "application/json");
        }

        public ActionResult Submit(HouseholdModel data)
        {
            JsonResponse response = new JsonResponse();

            if (data.Adults != null)
            {
                foreach (HouseholdMember adult in data.Adults)
                {
                    if (adult.HasContact())
                    {
                        response.isSuccess = false;
                        response.errorText = adult.ContactId + "|Is already in the system";
                        response.Add("contactId", adult.ContactId);
                        response.Add("firstName", adult.FirstName);
                        response.Add("lastName", adult.LastName);
                        response.Add("householdId", data.HouseholdId);
                    }
                    else
                    {
                        adult.HouseholdId = data.HouseholdId; // sets the adult's householdId to the current household
                        MinistryPlatform.CreatePerson(adult);

                    }
                }
            }

            if (data.Children != null)
            {
                foreach (ChildHouseholdMember child in data.Children)
                {
                    if (child.HasContact()) // Does child already exsist?
                    {
                        if (!child.ParticipantId.HasValue)
                        {
                            child.ParticipantId = MinistryPlatform.CreateParticipant(child);
                            MinistryPlatform.UpdateContact(child);
                        }

                        if (child.Relation == ChildHouseholdMember.RelationTypes.Child)
                        {
                            MinistryPlatform.CreateGroupParticipant(child);

                            MinistryPlatform.CreateDataNote(child.ContactId.Value, "Existing Contact Added to Household", "A Contact_Household record was created to pair this contact to " + data.HouseholdId + " household. If this is correct reassign this contact to the new household, otherwise change Other Household relationship to 'Guest' or 'Grandchild'.", "", ConfigurationManager.AppSettings["FirstTimeCheckinUserID"]);
                            MinistryPlatform.CreateShowsInCheckinWithEndDate(child, data.HouseholdId);
                        }
                        else if (child.Relation == ChildHouseholdMember.RelationTypes.Grandchild || child.Relation == ChildHouseholdMember.RelationTypes.Guest)
                        {
                            try
                            {
                                MinistryPlatform.GetGroupParticipant(child.ParticipantId.Value, child.Grade); // check if group participants already exsit
                            }
                            catch (StoredProcReturnedEmptyException)
                            {
                                // if they dont. create one
                                MinistryPlatform.CreateGroupParticipant(child);
                            }

                           
                            if (child.IsRegular)
                            {
                                MinistryPlatform.CreateShowsInCheckin(child, data.HouseholdId);
                            }
                            else
                            {
                                MinistryPlatform.CreateShowsInCheckinWithEndDate(child, data.HouseholdId);
                            }
                            MinistryPlatform.CreateDataNote(child.ContactId.Value, child.Relation.ToString() + " linked to household", "Informational", "", ConfigurationManager.AppSettings["FirstTimeCheckinUserID"]);
                        }
                    }
                    else
                    {
                        if (child.Relation == ChildHouseholdMember.RelationTypes.Child)
                        {
                            child.HouseholdId = data.HouseholdId;
                            MinistryPlatform.CreatePerson(child);
                            MinistryPlatform.CreateGroupParticipant(child);
                        }
                        else if (child.Relation == ChildHouseholdMember.RelationTypes.Grandchild || child.Relation == ChildHouseholdMember.RelationTypes.Guest)
                        {
                            child.HouseholdId = MinistryPlatform.CreateHousehold(child);
                            MinistryPlatform.CreatePerson(child);
                            MinistryPlatform.CreateGroupParticipant(child);

                            // pair the contact to data's household, not the one we just created
                            if (child.IsRegular)
                            {
                                MinistryPlatform.CreateShowsInCheckin(child, data.HouseholdId);
                            }
                            else
                            {
                                MinistryPlatform.CreateShowsInCheckinWithEndDate(child, data.HouseholdId);
                            }
                        }
                    }
                }
            }

            return Content(response.serialize(), "application/json");
        }

        public ActionResult CreateDataNote(DataNoteModel data)
        {
            if (data.UserId == null)
            {
                data.UserId = ConfigurationManager.AppSettings["FirstTimeCheckinUserID"];
            }

            MinistryPlatform.CreateDataNote(data);

            return Content(new JsonResponse().serialize(), "application/json");
        }

        public ActionResult GetHouseholdContacts()
        {
            JsonResponse response = new JsonResponse();

            int householdId = Convert.ToInt32(Request.Form["householdId"]);

            DataTable householdsContacts = MinistryPlatform.GetHouseholdContacts(householdId);

            response.Add("householdMembers", JsonParser.Table(householdsContacts));

            return Content(response.serialize(), "application/json");
        }

        public ActionResult FindContact(HouseholdMember data)
        {
            JsonResponse response = new JsonResponse();

            if (data.HasContact())
            {
                DataRow contactData = MinistryPlatform.GetContact(data).Rows[0];

                if (Convert.IsDBNull(contactData["Participant_Record"]))
                {
                   data.ParticipantId = MinistryPlatform.CreateParticipant(data);
                }
                else
                {
                    data.ParticipantId = (int)contactData["Participant_Record"];
                }

                if (Convert.IsDBNull(contactData["Household_ID"]))
                {
                   data.HouseholdId = MinistryPlatform.CreateHousehold(data);
                }
                else
                {
                    data.HouseholdId = (int)contactData["Household_ID"];
                }

                if (Convert.IsDBNull(contactData["Participant_Record"]) || Convert.IsDBNull(contactData["Household_ID"]))
                {
                    MinistryPlatform.UpdateContact(data);
                }

                response.Add("householdId", data.HouseholdId);
               
            }
            else
            {
                response.isSuccess = false;
                response.errorText = "No Contact Found";
            }

            return Content(response.serialize(), "application/json");
        }

        private int calculateAge(string dateOfBirth)
        {
            DateTime person = Convert.ToDateTime(dateOfBirth);
            DateTime now = DateTime.Now;
            return now.Year - person.Year;
        }
        
        public ActionResult GetGradeGroups()
        {
            JsonResponse response = new JsonResponse();
            DataTable table = MinistryPlatform.GetGradeGroups();

            List<LightboxSelectItem> groups = new List<LightboxSelectItem>();

            LightboxSelectItem currentSection = new LightboxSelectItem(); // create an empty object
            foreach (DataRow row in table.Rows)
            {
                if (currentSection.value != row["Parent_Group_ID"].ToString())
                {
                    currentSection = new LightboxSelectItem();
                    currentSection.value = row["Parent_Group_ID"].ToString();
                    currentSection.title = row["Parent_Group_Name"].ToString();

                    groups.Add(currentSection);
                }

                LightboxSelectItem addingItem = new LightboxSelectItem();
                addingItem.title = row["Group_Name"].ToString();
                addingItem.value = row["Group_ID"].ToString();
                currentSection.items.Add(addingItem);
            }

            response.Add("groups", groups);


            return Content(response.serialize(), "application/json");
        }

        

       
    }
}
