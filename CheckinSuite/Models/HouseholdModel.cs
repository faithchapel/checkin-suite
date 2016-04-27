using CheckinSuite.Exceptions;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;

namespace CheckinSuite.Models
{
    public class HouseholdModel
    {
        public int HouseholdId { get; set; }

        public string HouseholdPhone { get; set; }
        public List<HouseholdMember> Adults { get; set; }
        public List<ChildHouseholdMember> Children { get; set; }
    }

    public class HouseholdMember
    {

        public string FirstName
        {
            get;
            set;
        }

        public string LastName
        {
            get;
            set;
        }
        
        public string DateOfBirth { get; set; }
        public string Gender { get; set; }
        public int HouseholdPositionId { get; set; }

        public int? HouseholdId; // this varible should only be different from HouseholdModel if household member isn't apart of the family
        public int? ContactId;
        public int? ParticipantId;

        public bool HasContact()
        {
            FirstName = FirstName.Trim();
            LastName = LastName.Trim();
            try
            {
                DataTable contacts = MinistryPlatform.GetContact(this);
                if (contacts.Rows.Count == 1)
                {
                    this.ContactId = (int)contacts.Rows[0]["Contact_ID"];
                    if (!Convert.IsDBNull(contacts.Rows[0]["Participant_Record"]))
                    {
                        this.ParticipantId = (int)contacts.Rows[0]["Participant_Record"];
                    }
                    return true;
                }
                else
                {
                    return false;
                }
               
            }
            catch (StoredProcReturnedEmptyException)
            {
                return false;
            }
        }
    }

    public class ChildHouseholdMember : HouseholdMember
    {

        public RelationTypes Relation { get; set; }
        public string Grade { get; set; }
        public Boolean IsRegular { get; set; }

        public enum RelationTypes 
        {
            Child = 2,
            Guest = 5,
            Grandchild = 8
        }
    }
}