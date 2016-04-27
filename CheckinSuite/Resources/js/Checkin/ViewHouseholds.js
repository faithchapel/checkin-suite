var timeoutLength = 120000;

function Event(data) {
    var self = this;

    self.eventId = data.eventId;
    self.eventTitle = data.eventTitle;
    self.groupName = data.groupName;
    self.groupId = data.groupId;

    self.groupRoleTitle = ko.computed(function () {
        if (data.groupRoleTitle == "Participant") {
            return "";
        } else {
            return data.groupRoleTitle;
        }
    });

    self.isCheckinClosed = ko.observable(data.checkinClosed);
}

function Person(data) {
    var self = this;

    self.firstName = data.nickname;
    self.lastName = data.lastName;
    self.participantId = data.participantId;
    self.contactId = data.contactId;
    self.householdPosition = data.householdPositionId;

    self.groupParticipantId = data.groupParticipantId;
    self.groupRoldId = data.groupRoleId;

    self.availibleEvents = ko.observableArray([]);
    self.selectedEvent = ko.observable();
    for (var i = 0; i < data.events.length; i++) {
        self.availibleEvents.push(new Event(data.events[i]));
    }

    self.isAlreadyCheckedIn = data.isAlreadyCheckedIn;
    self.canCheckin = ko.computed(function () {
        if (!self.isAlreadyCheckedIn) {
            for (var i = 0; i < self.availibleEvents().length; i++) {
                if (!self.availibleEvents()[i].isCheckinClosed()) {
                    return true;
                }
            }
        }
        return false;
    });
}

function CurrentHousehold() {
    var self = this;

    self.name = ko.observable();

    self.householdMembers = ko.observableArray([]);

    self.index = ko.observable(0);

    self.clear = function () {
        self.householdMembers.removeAll();
    }
}

function ViewHouseholdsViewModel(data) {
    self.householdIds = ko.observableArray([]);
    self.activeEvents = data.activeEvents;
    self.programIds = data.programIds;

    self.manualTagPrintLightbox = new ManualTagPrintModel();

    if (Cookies.get('stationType') == "firstTimeCheckin") {
        $("#backToSearchButton").val("Back to Add/Edit Family");
    }

    self.currentHousehold = new CurrentHousehold();
    
    self.selectEventModel = new SelectEventModel();

    self.personClicked = function (person, event) {
        if (event.ctrlKey) { // person ctrl click is used for computers
            self.manualTagPrintLightbox.showLightbox(person);
        } else {
            if (person.canCheckin()) {
                if (person.availibleEvents().length == 1) {
                    if (person.selectedEvent() == null) {
                        person.selectedEvent(person.availibleEvents()[0]);
                    } else {
                        person.selectedEvent(null);
                    }

                } else {

                    self.selectEventModel.showLightbox(person);

                }
            }
        }
    }

    self.personHeld = function (personIndex) { // personHeld functionality is used for tablets
        var person = self.currentHousehold.householdMembers()[personIndex()];
        self.manualTagPrintLightbox.showLightbox(person);
    }

    self.nextFamily = function () {
        if (self.currentHousehold.index() + 1 < self.householdIds().length) {
            self.showHousehold(self.currentHousehold.index() + 1);
        }
    }
    self.prevFamily = function () {
        if (self.currentHousehold.index() > 0) {
            self.showHousehold(self.currentHousehold.index() - 1);
        }
    }

    self.showHousehold = function (index) {
        self.currentHousehold.index(index);

        $.post("/Checkin/GetCheckInOptions", {
            householdId: self.householdIds()[index].householdId,
            eventIds: self.activeEvents
        }, function (resp) {

            self.currentHousehold.householdMembers.removeAll();

            var householdMembers = resp.response.householdMembers;
            for (var i = 0; i < householdMembers.length; i++) {
                self.currentHousehold.householdMembers.push(new Person(householdMembers[i]));
            }


            self.currentHousehold.name(householdMembers[0].lastName);
            
        });
    }

    self.backToSearchButtonClick = function () {
        var stationType = Cookies.get('stationType');
        if (stationType == "firstTimeCheckin") {
            window.location = "/FirstTimeCheckin/EditHousehold/"+self.householdIds()[0].householdId+"?programIds=" + self.programIds;
        } else {
            window.location = "/Checkin/Index/?&programIds=" + self.programIds;
        }
        
    }

    self.submit = function () {
        

        var householdMembers = self.currentHousehold.householdMembers();
        var activeHouseholdMembers = []; // list of household members checking into an event

        for (var i = 0; i < householdMembers.length; i++) {
            var householdMember = householdMembers[i];
            if (householdMember.selectedEvent()) { // does the household member have an event they are checking into
                var obj = {
                    EventId: householdMember.selectedEvent().eventId,
                    GroupId: householdMember.selectedEvent().groupId,
                    ParticipantId: householdMember.participantId,
                    GroupParticipantId: householdMember.groupParticipantId,
                    GroupRoleId: householdMember.groupRoldId
                }
                activeHouseholdMembers.push(obj);
            }
        }
        if (activeHouseholdMembers.length > 0) {
            $(".submit-checkin-button").hide();
            $(".loader").css("display", "");
            $.ajax({
                url: "/Checkin/Submit",
                data: JSON.stringify(activeHouseholdMembers),
                type: "post",
                contentType: "application/json",
                dataType: "JSON"
            }).done(function (resp) {
                if (!resp.isSuccess) {
                    // Falied
                } else {

                    var redirectUrl = "";
                    if (Cookies.get('stationType') == "firstTimeCheckin") {
                        redirectUrl = "/FirstTimeCheckin/Index?programIds=" + self.programIds;
                    } else {
                        redirectUrl = "/Checkin/Index?programIds=" + self.programIds;
                    }

                    window.location = "/Print/Index/?eventParticipants=" + resp.response.eventParticipantIds + "&redirectUrl=" + btoa(redirectUrl);
                }
            });
        } else {
            swal({title: "Uh Oh!", type: "warning", text: "Please select at least one person to check in"})
        }
    }

    if (data.households) {
        for (var i = 0; i < data.households.length; i++) {
            self.householdIds.push({
                householdId: data.households[i].householdID,
                householdName: data.households[i].householdName
            });
        }

        self.showHousehold(0); // loads the first household
    } else {
        swal({ title: "Uh Oh!", text: "No households found! Please try a different search", type: "error" });
        window.location = "/Checkin/Index?programIds=" + self.programIds;
    }

    var idleManager = new IdleListenerManager();
    idleManager.add(function () {
        var stationType = Cookies.get('stationType');
        if (stationType == "firstTimeCheckin") {
            window.location = "/FirstTimeCheckin/Index?programIds=" + self.programIds;
        } else {
            window.location = "/Checkin/Index?programIds=" + self.programIds;
        }
    }, timeoutLength);
}

function run() {
    var hash = window.location.hash;
    if (hash) {
        var data = JSON.parse(atob(hash.replace("#", ""))); // gets the data from the url, decodes it from base 64, and parses it into json

        ko.bindingHandlers.fadeIn = {
            init: function (element) {
                $(ko.virtualElements.childNodes(element))
                    .filter(function () { return this.nodeType == 1; })
                    .hide()
                    .slideDown();
            }
        };
        ko.virtualElements.allowedBindings.fadeIn = true;

        ko.applyBindings(new ViewHouseholdsViewModel(data));
    } else {
        swal({ title: "Uh Oh!", text: "There was an error! Please try again!", type:"error"});
    }   
}
