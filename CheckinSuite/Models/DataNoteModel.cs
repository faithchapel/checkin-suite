using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace CheckinSuite.Models
{
    public class DataNoteModel
    {
        public int ContactId { get; set; }
        public string NoteTitle { get; set; }
        public string NoteText { get; set; }
        public string ContactPhone { get; set; }
        public string UserId { get; set; }
    }

}