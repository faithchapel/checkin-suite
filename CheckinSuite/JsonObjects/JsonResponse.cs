using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;
using System.Web.Script.Serialization;

namespace CheckinSuite.JsonObjects
{
    public class JsonResponse
    {
        public bool isSuccess = true;
        public string errorText;

        public Dictionary<string, object> response;

        public JsonResponse()
        {
            response = new Dictionary<string, object>();
        }

        public void throwError(string errorText)
        {
            this.errorText = errorText;
            this.isSuccess = false;
        }

        public void Add(string key, object obj)
        {
            response.Add(key, obj);
        }

        public void Add(DataTable table)
        {
            foreach (DataRow row in table.Rows)
            {
                foreach (DataColumn col in table.Columns)
                {
                    response.Add(JsonParser.formatColumnName(col.ColumnName), row[col.ColumnName].ToString());
                }
            }
        }

        public string serialize()
        {
            return new JavaScriptSerializer().Serialize(this);
        }
    }
}