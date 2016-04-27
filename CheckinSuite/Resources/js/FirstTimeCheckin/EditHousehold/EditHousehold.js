var timeoutLength = 120000; // in miliseconds

function HouseholdMember(data) {
    var self = this;
    self.contactId = data.contactId;

    self.firstName = ko.computed(function () {
        return data.firstName + " " + ((data.suffix) ? data.suffix : "");
    });
    self.lastName = ko.observable(data.lastName);
    self.dateOfBirth = ko.observable(data.dateOfBirth);
    self.gender = ko.observable(data.gender);
    self.householdPositionId = data.householdPositionId;

    self.isNew = data.isNew;

    self.serialize = function () {
        var data = {};
        var keys = Object.keys(this);
        for (var i = 0; i < keys.length; i++) {
            var propName = keys[i].charAt(0).toUpperCase() + keys[i].slice(1);
            data[propName] = ko.utils.unwrapObservable(this[keys[i]]);
        }

        return data;
    }
}

function ChildHouseholdMember(data) {
    var self = this;    
    HouseholdMember.call(self, data); // calls the parent (kind of like extend and super in the same line)

    self.relation = ko.observable(data.relation);
    self.grade = ko.observable(data.grade);
    self.isRegular = ko.observable(data.isRegular);
}

var Grade = function (data) {
    this.label = ko.observable(data.label);
    this.value = ko.observable(data.value);
}

function FirstTimeCheckinViewModel(householdId, programIds) {

    self.householdId = householdId;
    self.programIds = programIds;
    self.lookupPhoneNumber = ko.observable();

    self.householdMembers = ko.observableArray([]);

    self.adultCount = ko.computed(function () {
        var count = 0;
        for (var i = 0; i < self.householdMembers().length; i++) {
            if (self.householdMembers()[i].householdPositionId == 1) {
                count++;
            }
        }
        return count;
    });

    self.editPersonModel = new EditPersonModel();
    self.addAdultModel = new AddAdultModel(self.householdMembers);
    self.addChildModel = new AddChildModel(self.householdMembers);

    self.addAdult = function () {
        self.addAdultModel.showLightbox();
    }
    self.addChild = function () {
        self.addChildModel.showLightbox();
    }

    self.backToSeachButtonClick = function () {
        var stationType = Cookies.get('stationType');
        if (stationType == "firstTimeCheckin") {
            redirectWithPreserve("/FirstTimeCheckin/Index");
        } else {
            redirectWithPreserve("/Checkin/Index");
        }
        
    }

    self.submit = function () {
        $(".save-button").hide();
        $(".loader").css("display", "");

        var obj = {
            HouseholdId: self.householdId,
            HouseholdPhone: lookupPhoneNumber(),
            Adults: [],
            Children: [],
        }
        for (var i = 0; i < householdMembers().length; i++) {
            var info = householdMembers()[i].serialize();
            if (info.IsNew) {
                if (householdMembers()[i].householdPositionId == 1) {
                    obj.Adults.push(householdMembers()[i].serialize());
                } else {
                    obj.Children.push(householdMembers()[i].serialize());
                }
            }

        }

        $.ajax({
            url: "/FirstTimeCheckin/Submit",
            type: "POST",
            data: JSON.stringify(obj),
            contentType: "application/json",
            dataType: "JSON"
        }).done(function (resp) {
            var response = resp.response;
            if (!resp.isSuccess) {
                displayAdultAlreadyExistsLightbox(response.firstName, response.lastName, response.contactId, response.householdId, self.programIds);
            } else {
                redirectToCheckin(self.householdId, self.programIds);
            }
        });
    }

    $.post("/FirstTimeCheckin/GetHouseholdContacts", {
        householdId: householdId
    }, function (resp) {
        if (!resp.isSuccess) {
            swal({
                title: "Uh Oh!",
                text: "There was an issue loading your household. Please request assistance",
                type: "error"
            })
        } else {
            var members = resp.response.householdMembers;
            for (var i = 0; i < members.length; i++) {

                var data = {
                    contactId: members[i].contactID,
                    firstName: members[i].nickname,
                    lastName: members[i].lastName,
                    dateOfBirth: members[i].dateofBirth,
                    householdPositionId: members[i].householdPositionID,
                    isNew: false,
                    suffix: members[i].suffix
                }

                if (members[i].householdPositionID == 1) {
                    self.householdMembers.push(new HouseholdMember(data));
                } else {
                    self.householdMembers.push(new ChildHouseholdMember(data));
                }

            }
        }
    });

    var idleManager = new IdleListenerManager();
    idleManager.add(function () {
        var stationType = Cookies.get('stationType');
        if (stationType == "checkin") {
            redirectWithPreserve('/Checkin/Index');
        } else {
            redirectWithPreserve('/FirstTimeCheckin/Index');
        }
    }, timeoutLength);
}

function displayAdultAlreadyExistsLightbox(firstName, lastName, contactId, householdId, programIds) {
    var html = "<form id='swalForm' class='pure-form'>" +
        "Looks like " + firstName + " " + lastName + " is already in our system. Would you like to request they be added to this family?<br><br>" +
        "If so, please provide a brief description of relationship to this family<br><br>" +
        "<textarea name='note' id='note' style='width:100%' required></textarea><br><br>" +
        "Phone number to call if we have questions<input type='text' name='phone' id='phone' required />" +
        "<input type='hidden' id='contactId' value='" + contactId + "'/>" +
        "<input type='hidden' id='householdId' value='" + householdId + "'/>" +
    "</form>";

    swal({
        title: 'Oh Hey!',
        type: 'info',
        html: html,
        showCancelButton: true,
        closeOnConfirm: false,
        allowOutsideClick: false,
        allowEscapeKey: false,

    }, function () {
        var isValid = true;

        $("#swalForm textarea, #swalForm :input").not(":hidden").each(function () {
            if ($(this).val().length <= 0) {
                isValid = false;
                $(this).addClass("validation-error");
            }
        });

        if (isValid) {
            var options = {
                url: "/FirstTimeCheckin/CreateDataNote",
                type: "post",
                dataType: "JSON",
                contentType: "application/json",
                data: JSON.stringify({
                    ContactId: $("#contactId").val(),
                    NoteTitle:"Request to Add Existing Contact to Household",
                    NoteText: "The Contact has been requested to be added to Household #"+$("#householdId").val()+". Review and make necessary changes. User Explanation:" + $("#note").val(),
                    ContactPhone: $("#phone").val()
                })
            }
            $.ajax(options).done(function (resp){ 
                swal({
                    title: "Thank you!",
                    text: "Your request has been processed. Our data integrity team will get to it by next week",
                    type: 'success',
                    allowOutsideClick: 'false'
                }, function () {
                    redirectWithPreserve("/FirstTimeCheckin/Index");
                });
            });
        }
    });
}

function redirectToCheckin(householdId, programIds) {
    $.ajax({
        url: "/Checkin/GetActiveCheckinEvents",
        data: { programIds:  programIds},
        type: 'post',
        dataType: 'json'
    }).done(function (resp) {
        try{
            if (resp.isSuccess) {
                var eventsLive = resp.response.activeEvents;

                if (eventsLive.length < 0) {
                    throw "no events found";
                } else {
                    var activeEvents = eventsLive.map(function (elem) {
                        return elem.eventID;
                    }).join("-");

                    var data = {
                        households: [
                            { householdID: householdId.toString() }
                        ],
                        activeEvents: activeEvents,
                        programIds: programIds
                    };

                    window.location = "/Checkin/ViewHouseholds#" + btoa(JSON.stringify(data));
                } 
            } else {
                throw "no events found";
            }
        } catch (e) {
            swal({
                title: "Thank you!",
                text: "Your data has been saved",
                type: "success",
                timer: 2000
            }, function () {
                redirectWithPreserve("/FirstTimeCheckin/Index");
            });
        }
    });
}

