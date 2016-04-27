function CreatePersonModel(programIds, firstName, lastName, dateOfBirth) {
    var self = this;

    self.isVisible = ko.observable(false);

    // observables/data from index.js
    self.programIds = programIds;
    self.firstName = firstName;
    self.lastName = lastName;
    self.dateOfBirth = dateOfBirth;

    self.phone = ko.observable().extend({
        forceFormat: "###-###-####",
        kavie: { required: true, min: 12 }
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

    self.isChild = ko.observable(false);
    self.dateOfBirth.subscribe(function (newValue) {
        self.isChild(isMinor(newValue));
    });

    self.showLightbox = function () {
        self.isVisible(true);
    }

    self.submit = function () {
        var data = {
            Children: [],
            Adults: [],
            HouseholdPhone: self.phone(),
            HouseholdId: self.householdId
        }

        var person = {
            FirstName: self.firstName(),
            LastName: self.lastName(),
            DateOfBirth: self.dateOfBirth(),
            Gender: self.gender()
        }

        if (isMinor(self.dateOfBirth())) {
            person.Grade = self.grade();
            data.Children.push(person);
        } else {
            data.Adults.push(person);
        }

        $("#createPersonSubmitButton").hide();
        $("#createPersonSubmitSpinner").css("display", "");
        $.ajax({
            url: "/FirstTimeCheckin/CreatePerson",
            data: JSON.stringify(data),
            contentType: "application/json",
            dataType: 'JSON',
            type: 'POST'
        }).done(function (resp) {
            window.location = "/FirstTimeCheckin/editHousehold/" + resp.response.householdId + "?programIds=" + self.programIds;
        });
    }

}

function isMinor(date) {
    var age = calculateAge(new Date(date));
    if (age < parseInt($("#adultAge").val())) {
        return true;
    } else {
        return false;
    }
}

function calculateAge(birthday) { // birthday is a date
    var ageDifMs = Date.now() - birthday.getTime();
    var ageDate = new Date(ageDifMs); // miliseconds from epoch
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}