function ViewModel(programIds) {
    var self = this;
    self.eventTitles = ko.observable();

    self.phone = ko.observable().extend({
        kavie: { required: true }
    });
    self.programIds = programIds;

    self.activeEvents = "";

    self.validatePinLightbox = new ValidatePinModel(function () {        
        window.location = "/FirstTimeCheckin/Index?programIds=" + self.programIds;
    });

    self.submit = function (viewModel, event) {
        if (event.ctrlKey) {
            self.validatePinLightbox.showLightbox();
        } else {
            if (Kavie.isValid(self)) {
                $.ajax({
                    url: "/Checkin/GetHouseholds",
                    data: { phone: self.phone() },
                    type: 'post',
                    dataType: 'json'
                }).done(function (resp) {
                    if (!resp.isSuccess) {
                        swal({ title: "Uh Oh!", text: resp.errorText, type: "error" });
                    } else {
                        var data = {
                            programIds: self.programIds,
                            households: resp.response.households,
                            activeEvents: self.activeEvents,
                            isFirstTime: self.isFirstTime
                        };
                        window.location = "/Checkin/ViewHouseholds#" + btoa(JSON.stringify(data));
                    }
                });
            }
        }
    }

    self.getLiveEvents = function () {
        $.ajax({
            url: "/Checkin/GetActiveCheckinEvents",
            data: { programIds: self.programIds },
            type: 'post',
            dataType: 'json'
        }).done(function (resp) {
            if (resp.isSuccess) {
                var eventsLive = resp.response.activeEvents;

                if (eventsLive.length < 0) {
                    self.eventTitles("No events found");
                } else {
                    self.eventTitles(eventsLive.map(function (elem) {
                        return elem.eventTitle;
                    }).join(" | "));
                    
                }
                self.activeEvents = eventsLive.map(function (elem) {
                    return elem.eventID;
                }).join("-");
                var result = self.activeEvents;
            } else {
                self.eventTitles("No events found");
            }
        });
    }

    var idleManager = new IdleListenerManager();
    idleManager.add(function () {
        self.getLiveEvents();
    }, 60000);

    idleManager.add(function () {
        Kavie.deactivate(self);
    }, 5000);

    idleManager.add(function () {
        var stationType = Cookies.get('stationType');
        if (stationType) {
            if (stationType == "firstTimeCheckin") {
                window.location = "/FirstTimeCheckin/Index?programIds=" + self.programIds;
            }
        }
    }, 120000);

    self.getLiveEvents();
}

function run() {
    var currentURL = document.URL;
    var params = currentURL.extract();

    ko.applyBindings(new ViewModel(params.programIds));
}