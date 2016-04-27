using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Web;

namespace CheckinSuite.JsonObjects
{
    public static class JsonParser
    {
        public static List<Dictionary<string, string>> Table(DataTable table)
        {
            List<Dictionary<string, string>> rows = new List<Dictionary<string, string>>();
            foreach (DataRow row in table.Rows)
            {
                Dictionary<string, string> rowData = new Dictionary<string, string>();

                foreach (DataColumn col in table.Columns)
                {
                    string colName = formatColumnName(col.ColumnName.ToString());
                    rowData.Add(colName, row[col.ColumnName].ToString());
                }

                rows.Add(rowData);
            }
            return rows;
        }

        public static string formatColumnName(string columnName)
        {
            columnName = camelCase(columnName);
            columnName = removeSymbol(columnName);
            return columnName;
        }

        public static string camelCase(string str)
        {
            // input example: Address_Line_1
            // output example: addressLine1

            // lower case first letter
            StringBuilder builder = new StringBuilder(str);
            builder.Remove(0, 1);
            builder.Insert(0, str.Substring(0, 1).ToLower());
            str = builder.ToString();

            // strips underscores
            str = str.Replace("_", "");

            return str;

        }

        public static string removeSymbol(string str)
        {
            // the Table: 'locations' uses the column name: 'State/Region' the / messes up json on the javascript side
            // this removes the /

            return str.Replace("/", "");
        }
    }
}