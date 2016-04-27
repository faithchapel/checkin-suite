using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace CheckinSuite.Exceptions
{
    public class DatabaseUpdateRecordFailedException : Exception
    {
        public DatabaseUpdateRecordFailedException() { }
        public DatabaseUpdateRecordFailedException(string message) : base(message) { }
    }
}