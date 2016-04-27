using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace CheckinSuite.Exceptions
{
    public class StoredProcReturnedEmptyException : Exception
    {
        public StoredProcReturnedEmptyException() { }
        public StoredProcReturnedEmptyException(string message) : base(message) { }
    }
}