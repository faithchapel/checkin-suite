function ValidatePinModel(successFunction) {
    var self = this;
    self.successFunction = successFunction;

    self.isVisible = ko.observable(false);

    self.pin = ko.observable();
    
    self.hideLightbox = function () {
        self.pin("");
        self.isVisible(false);
    }

    self.showLightbox = function () {
        self.isVisible(true);
        $(".pin-input").focus();
    }

    self.validatePin = function () {
        $.post("/Home/ValidatePIN", {
            pin: self.pin()
        }, function (resp) {
            if (!resp.isSuccess) {
                swal("Uh Oh", "Your pin is invalid", "error");
            } else {
                if (resp.response.userId) { // just to make sure there is a person returned
                    self.successFunction(resp.response);
                }
            }
        });
    }
}