var ageLimit = 16; // allows 16 year olds and up

function AddAdultModel(householdMembersArray) {
    var self = this;
    self.lightboxVisible = ko.observable(false);
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

    self.gender = ko.observable().extend({
        kavie: { required: true }
    });
    self.selectGenderLightbox = new LightboxSelect({
        title: "Select a Gender",
        items: [
            { title: "Male", value: 1, color: "#8CD4F5" },
            { title: "Female", value: 2, color: "#f58ca0" }
        ]
    }, function (value) {
        self.gender(value);
    });

    self.showLightbox = function () {
        self.lightboxVisible(true);
    }

    self.hideLightbox = function () {
        self.lightboxVisible(false);

        self.firstName("");
        self.lastName("");
        self.dateOfBirth("");

        Kavie.deactivate(self);
    }

    self.submit = function () {
       
        if (Kavie.isValid(self)) {
            if (calculateAge(new Date(self.dateOfBirth())) >= ageLimit) {
                var data = {
                    isNew: true,
                    firstName: self.firstName(),
                    lastName: self.lastName(),
                    dateOfBirth: self.dateOfBirth(),
                    gender: self.gender(),
                    householdPositionId: 1
                }
                self.householdMembers.push(new HouseholdMember(data));
                self.hideLightbox();
                $(".save-button").show();
            } else {
                swal({ title: "Uh Oh!", text: "Please only add adults to this area", type: "error" });
            }
        }
    }
}
