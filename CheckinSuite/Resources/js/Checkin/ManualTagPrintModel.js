function ManualTagPrintModel(userId) {
    var self = this;
    self.userId = "";
    self.contactId = "";
    self.name = ko.observable();
   
    self.validatePinLightbox = new ValidatePinModel(function (userData) {
        self.userId = userData.userId;
        self.validatePinLightbox.hideLightbox();
        self.isVisible(true);
    });

    self.isVisible = ko.observable(false);

    self.event = ko.observable().extend({
        kavie: { required: true }
    });
    self.selectEventLightbox = new LightboxSelect({
        title: "Select an Event"
    }, function (value) {
        self.event(value);
    });

    $.post("/Checkin/GetOverrideEventList", function (resp) {
        var events = resp.response.events;
        var data = {
            title: "Select an Event",
            items: events
        }

        self.selectEventLightbox.addData(data);
    });

    self.grade = ko.observable().extend({
        kavie: { required: true }
    });

    self.selectGradeLightbox = new LightboxSelect({
        title: "Select a Grade"
    }, function (value) {
        self.grade(value);
    });

    $.post("/FirstTimeCheckin/GetGradeGroups", function (resp) {
        var groups = resp.response.groups;
        var data = {
            title: "Select a Grade",
            items: groups
        }

        var colors = ['#F27474', '#8CD4F5', '#F8BB86', '#A5DC86'];
        for (var i = 0; i < groups.length; i++) {
            data.items[i].color = colors[i];
        }

        self.selectGradeLightbox.addData(data);
    });

    self.note = ko.observable();

    self.createGroupParticipant = ko.observable(false);

    self.submit = function () {
       
        if (Kavie.isValid(self)) {
            $("#manualTagPrintSubmitButton").hide();
            $.post("/Checkin/ManualTagPrintSubmit", {
                eventId: self.event(),
                groupId: self.grade(),
                note: self.note(),
                userId: self.userId,
                contactId: self.contactId,
                createGroupParticipant: self.createGroupParticipant()

            }, function (resp) {
                window.location = "/Print/Index?eventParticipants=" + resp.response.eventParticipantId + "&redirectUrl=" + btoa(window.location.href); 
            });
        }
    }

    self.showLightbox = function (person) {
        self.validatePinLightbox.showLightbox();
        self.contactId = person.contactId;
        self.name(person.firstName + " " + person.lastName);
    }

    self.hideLightbox = function () {
        self.isVisible(false);
        Kavie.deactivate(self);
    }
}