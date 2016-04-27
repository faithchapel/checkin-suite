using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace CheckinSuite.Models
{
    public class ParticipatingHouseholdMemberModel
    {
        public int ParticipantId { get; set; }
        public int GroupId { get; set; }
        public int EventId { get; set; }
        public int GroupParticipantId { get; set; }
        public int GroupRoleId { get; set; }
    }
}