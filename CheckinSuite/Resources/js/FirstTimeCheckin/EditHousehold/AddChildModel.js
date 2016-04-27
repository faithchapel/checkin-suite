var ageCap = 18; // limits children to 18 and under

function AddChildModel(householdMembersArray) {
    var self = this;
    self.lightboxVisible = ko.observable(false);
    self.selectGradeVisible = ko.observable(false);

    self.householdMembers = householdMembersArray;

    self.firstName = ko.observable().extend({
        kavie: { required: true }
    });
    self.lastName = ko.observable().extend({
        kavie: { required: true }
    });
    self.dateOfBirth = ko.observable().extend({ forceFormat: "##/##/####" }).extend({
        kavie: { required: true, birthdate: true }
    });

    self.gender = ko.observable().extend({ kavie: { required: true } });
    self.selectGenderLightbox = new LightboxSelect({
        title: "Select a Gender",
        items: [
            { title: "Male", value: 1, color: "#8CD4F5" },
            { title: "Female", value: 2, color: "#f58ca0" }
        ]
    }, function (value) {
        self.gender(value);
    });

    self.relation = ko.observable().extend({
        kavie: { required: true }
    });
    self.regular = ko.observable();
    self.selectRelationLightbox = new LightboxSelect({
        title: "Select a Relation",
        items: [
            { title: "My Child", value: 2, color: "#759C5F" },
            { title: "Grandchild/Relative", value: 8, color: "#436675" },
            { title: "Friend/Neighbor", value: 5, color: "#C45E5E" }
        ]
    }, function (value) {
        self.relation(value);
        if (value == 5 || value == 8) {
            swal({
                title: "Regular?",
                text: "Would you like to see this child every time you check in?",
                type: "info",
                confirmButtonText: 'Yes',
                cancelButtonText: 'No',
                showCancelButton: true,
                closeOnConfirm: false,
                closeOnCancel: false,
                allowOutsideClick: false
            }, function (isConfirm) {
                if (isConfirm) {
                    self.regular(1);
                } else {
                    self.regular(0);
                }
                $(".sweet-alert, .sweet-overlay").hide();
            });
        }
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

    self.showLightbox = function () {
        self.lightboxVisible(true);
    }

    self.hideLightbox = function () {
        self.lightboxVisible(false);

        self.firstName("");
        self.lastName("");
        self.dateOfBirth("");
        self.relation("");
        self.regular("");
        self.grade("");
        self.gender("");

        self.selectGenderLightbox.resetData();
        self.selectRelationLightbox.resetData();
        self.selectGradeLightbox.resetData();

        Kavie.deactivate(self);
    }

    self.submit = function () {
        if (calculateAge(new Date(self.dateOfBirth())) >= ageCap) {
            swal({
                title: "Uh Oh!",
                text: "It looks like this person is actually an adult. Please only add minor children to your family.",
                type: "error"
            });
        } else {
            if (Kavie.isValid(self)) {

                var child = new ChildHouseholdMember({
                    isNew: true,
                    firstName: self.firstName(),
                    lastName: self.lastName(),
                    dateOfBirth: self.dateOfBirth(),
                    householdPositionId: self.relation(),
                    relation: self.relation(),
                    isRegular: self.regular(),
                    grade: self.grade(),
                    gender: self.gender()

                });
                self.householdMembers.push(child);

                self.hideLightbox();

                $(".save-button").show();

            }
        }
    }
}

function calculateAge(birthday) { // birthday is a date
    var ageDifMs = Date.now() - birthday.getTime();
    var ageDate = new Date(ageDifMs); // miliseconds from epoch
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}