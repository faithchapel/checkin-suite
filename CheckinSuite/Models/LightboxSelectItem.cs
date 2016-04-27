using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace CheckinSuite.Models
{
    public class LightboxSelectItem
    {
        public string title;
        public string value;
        public List<LightboxSelectItem> items;

        public LightboxSelectItem()
        {
            items = new List<LightboxSelectItem>();
        }
    }
}