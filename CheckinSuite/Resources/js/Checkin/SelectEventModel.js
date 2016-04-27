function SelectEventModel() {
    var self = this;

    self.lightboxVisible = ko.observable(false);

    self.person = null;

    self.events = ko.observableArray([]);

    self.showLightbox = function (person) {
        self.person = person;
        self.lightboxVisible(true);

        for (var i = 0; i < person.availibleEvents().length; i++) {
            self.events.push(person.availibleEvents()[i]);
        }
        
    }

    self.hideLightbox = function () {
        self.events.removeAll();
        self.lightboxVisible(false);
    }

    self.eventClicked = function (event) {
        var theEvent = self.events()[self.events.indexOf(event)];
        
        self.person.selectedEvent(theEvent);

        self.hideLightbox();
    }

    self.clearEvent = function () {
        self.eventClicked(null);
    }
}