using CheckinSuite.Exceptions;
using CheckinSuite.JsonObjects;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace CheckinSuite.Controllers
{
    public class HomeController : Controller
    {
        //
        // GET: /Home/

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult ValidatePIN()
        {
            JsonResponse response = new JsonResponse();
            string pin = Request["pin"];
            try
            {
                DataRow user = MinistryPlatform.ValidatePIN(pin);
                response.Add("userId", user["User_ID"]);
            }
            catch (StoredProcReturnedEmptyException)
            {
                response.isSuccess = false;
                response.errorText = "Invalid Pin";
            }

            return Content(response.serialize(), "application/json");

        }

    }
}
