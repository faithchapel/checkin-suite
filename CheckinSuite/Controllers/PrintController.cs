using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Mvc;

namespace CheckinSuite.Controllers
{
    public class PrintController : Controller
    {
        public ActionResult Index()
        {
            string eventParticipantIds = Request["eventParticipants"].ToString();

            string a = Request["redirectUrl"].ToString();
            string redirectUrl = Encoding.UTF8.GetString(Convert.FromBase64String(Request["redirectUrl"].ToString())); // Redirect url needs to be encoded because # is stripped in a get variable
            ViewBag.redirectUrl = redirectUrl;

            DataTable peopleData = MinistryPlatform.GetPrintingData(eventParticipantIds);

            List<TagData> dataList = new List<TagData>();

            List<string> seenIDs = new List<string>();
            foreach (DataRow row in peopleData.Rows) // all people returned
            {
                if (!seenIDs.Contains(row["Contact_ID"].ToString()))
                {
                    dataList.Add(new TagData(row, peopleData));
                    seenIDs.Add(row["Contact_ID"].ToString());
                }
            }

            ViewBag.dataList = dataList;

            return View();
        }
    }
    
    public class TagData {

        public string ContactId;

        public string Nickname;
        public string LastName;
        public string GroupName;
        public string EventTitle;
        public string TimeIn;
        public string SecureCheckin;
        public string SupressParentTag;
        public int TimesAttended;

        public string GuardianOne; // is set from constructer
        public string GuardianTwo; // is set later once found


        public TagData(DataRow data, DataTable allPeople)
        {
            this.ContactId = data["Contact_ID"].ToString();

            this.Nickname = data["Nickname"].ToString();
            this.LastName = data["Last_Name"].ToString();
            this.GroupName = data["Group_Name"].ToString();
            this.EventTitle = data["Event_Title"].ToString();
            this.TimeIn = data["Time_In"].ToString();
            this.SecureCheckin = data["Secure_Check-in"].ToString();
            this.SupressParentTag = data["Supress_Parent_Tag"].ToString();
            this.TimesAttended = Convert.ToInt32(data["Number_Of_Times_Attended"]);

            this.GuardianOne = data["GuardianName"].ToString();

            DataView dv = allPeople.DefaultView;
            dv.RowFilter = "(Contact_ID = " + this.ContactId + ") AND (GuardianName <> '" +  HttpContext.Current.Server.UrlEncode(this.GuardianOne) + "')";
            DataTable otherGuardian = dv.ToTable();


            if (otherGuardian.Rows.Count > 0)
            {
                this.GuardianTwo = otherGuardian.Rows[0]["GuardianName"].ToString();
            }
        }
    }
}
