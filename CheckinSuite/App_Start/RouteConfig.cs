using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace CheckinSuite
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

           

            routes.MapRoute(
               name: "editHousehold",
               url: "FirstTimeCheckin/editHousehold/{id}",
               defaults: new { controller = "FirstTimeCheckin", action = "editHousehold", id = UrlParameter.Optional }
           );

            routes.MapRoute(
               name: "print",
               url: "Print/Index/{eventParticipantIds}",
               defaults: new { controller = "Print", action = "Index", eventParticipantIds = UrlParameter.Optional }
           );

            routes.MapRoute(
               name: "Default",
               url: "{controller}/{action}/{id}",
               defaults: new { controller = "Home", action = "Index", id = UrlParameter.Optional }
           );
        }
    }
}