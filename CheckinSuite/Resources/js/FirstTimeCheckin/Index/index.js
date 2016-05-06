function ViewModel(programIds) {
    var self = this;

    self.programIds = programIds;

    self.validatePinLightbox = new ValidatePinModel(function () {
        window.location = "/Checkin/Index?programIds=" + self.programIds;
    });

    self.firstName = ko.observable().extend({
        kavie: { required: true }
    });
    self.lastName = ko.observable().extend({
        kavie: { required: true }
    });
    self.dateOfBirth = ko.observable().extend({ forceFormat: "##/##/####" }).extend({
        kavie: { required: true, birthdate: true }
    });

    self.createPersonLightbox = new CreatePersonModel(self.programIds, self.firstName, self.lastName, self.dateOfBirth);

    self.submit = function (viewModel, event) {
        if (event.ctrlKey) {
            self.validatePinLightbox.showLightbox();
        } else {
            if (Kavie.isValid(self)) {
                $(".search-button").hide();
                $("#indexSubmitSpinner").css("display", "");

                var personAge = calculateAge(new Date(self.dateOfBirth()));               
                submitPerson();
               
            }
        }
    }


    function submitPerson() {
        var data = {
            FirstName: self.firstName(),
            LastName: self.lastName(),
            DateOfBirth: self.dateOfBirth()
        }

        var options = {
            url: "/FirstTimeCheckin/FindContact",
            data: JSON.stringify(data),
            contentType: "application/json",
            dataType: 'JSON',
            type: 'POST'
        }
        $.ajax(options).done(function (resp) {
            if (!resp.isSuccess) {
                self.createPersonLightbox.showLightbox();
            } else {
                window.location = "/FirstTimeCheckin/editHousehold/" + resp.response.householdId + "?programIds=" + self.programIds;
            }
        });
    }

    IdleListener.add(function () {
        var stationType = Cookies.get('stationType');
        if (stationType) {
            if (stationType == "checkin") {
                window.location = "/Checkin/Index?programIds=" + self.programIds;
            }
        }
    }, 120000);

   
}

function run() {
    var currentURL = document.URL;
    var params = currentURL.extract();

    ko.applyBindings(new ViewModel(params.programIds));
}

function calculateAge(birthday) { // birthday is a date
    var ageDifMs = Date.now() - birthday.getTime();
    var ageDate = new Date(ageDifMs); // miliseconds from epoch
    return ageDate.getUTCFullYear() - 1970;
}

function isPhoneValid(number) {
    number = number.replace(/[^0-9]/g, '');
    if (number.length === 7 || number.length === 10) {
        return true;
    } else {
        return false;
    }
}

function formatPhone(number) {
    number = number.replace(/[^0-9]/g, '');
    if (number.length > 7) {
        number = number.insertAt(3, "-");
        if (number.length > 10) {
            number = number.insertAt(7, "-");
        }
    }
    return number;
}

String.prototype.insertAt = function (index, string) {
    return this.substr(0, index) + string + this.substr(index);
}
