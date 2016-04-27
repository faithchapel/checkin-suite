var data = {
    questions: [
        {
            label: "Name is incorrect",
            elementLabel: "Correct Name: ",
            elementType: "text"
        },
        {
            label: "Shouldn't be listed with my family",
            elementLabel: "What happened? ",
            elementType: "textarea"
        },
        {
            label: "Wrong grade listed",
            elementLabel: "Correct Grade: ",
            elementType: "text",
            filter: "onlyChildren"
        },
        {
            label: "Something else",
            elementLabel: "Please Describe",
            elementType: "textarea"
        }
    ]
}


function EditPersonModel() {
    var self = this;
    self.lightboxVisible = ko.observable(false);

    self.questions = ko.observableArray([]);
    self.contactPhone = ko.observable().extend({ kavie: { required: true, min: 10, max: 10 } });

    self.personName = ko.observable();
    self.personContactId = null;

    self.householdPositionId = ko.observable();

    for (var i = 0; i < data.questions.length; i++) {
        self.questions.push(new Question(data.questions[i], self));
    }

    self.showLightbox = function (person) {
        // person is object from the ko children array
        self.lightboxVisible(true);

        
        self.personName(person.firstName() + " " + person.lastName());
        self.personContactId = person.contactId;
        self.householdPositionId(person.householdPositionId);

    }

    self.questionClicked = function (question) {
        var currentStatus = question.isVisible()
        self.hideQuestions();
        question.isVisible(!currentStatus);
    }

    self.hideQuestions = function () {
        for (var i = 0; i < self.questions().length; i++) {
            self.questions()[i].isVisible(false);
        }
    }

    self.hideLightbox = function () {
        self.lightboxVisible(false);

        self.contactPhone("");
        for (var i = 0; i < self.questions().length; i++) {
            self.questions()[i].userInput("");
        }
    }


    self.submit = function () {

      
        if (Kavie.isValid(self)) {
            var text = "";
            for (var i = 0; i < self.questions().length; i++) {
                text += self.questions()[i].toString();
            }
            var data = {
                ContactId: self.personContactId,
                NoteTitle: "User Requested Change",
                NoteText: text,
                ContactPhone: self.contactPhone(),
            }
            $.ajax({
                url: "/FirstTimeCheckin/CreateDataNote",
                type: "POST",
                data: JSON.stringify(data),
                contentType: "application/json",
                dataType: "JSON"
            }).done(function (resp) {
                var response = resp.response;
                if (!resp.isSuccess) {
                    // error
                } else {
                    swal({
                        title: "Thank You!",
                        html: "Having the correct information helps us care for your kids and family. <br><br>Our Data Integrity team will review and make changes by next weekend.",
                        type: "success"
                    });
                    self.hideLightbox();
                }
            });

        }
    }
}

function Question(options, parent) {
    var self = this;

    self.label = options.label;
    self.elementLabel = options.elementLabel;
    self.elementType = options.elementType;
    self.userInput = ko.observable();

    self.filter = ko.observable(options.filter);

    self.showQuestion = ko.computed(function () {
        if (parent.householdPositionId() == 1) {
            if (self.filter() == 'onlyChildren') {
                return false;
            }
        }
        return true;
    });

    self.isVisible = ko.observable(false);

    self.toString = function () {
        if (self.userInput()) {
            return self.label + " [" + self.elementLabel + ": " + self.userInput() + "]\n";
        } else {
            return "";
        }

    }

}