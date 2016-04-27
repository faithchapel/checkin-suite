function ParentGroup(data, backgroundColor) {
    this.label = ko.observable(data.label);
    this.subGroups = ko.observableArray([]);
    this.backgroundColor = ko.observable(backgroundColor);

    for (var i = 0; i < data.subGroups.length; i++) {
        this.subGroups.push(new SubGroup(data.subGroups[i], backgroundColor));
    }
}

function SubGroup(data, backgroundColor) {
    this.label = data.label;
    this.value = data.value;
    this.backgroundColor = backgroundColor;
}

function SelectGroupModel() {
    var self = this;

    self.gradeGroups = ko.observableArray([]);
    self.currentSubGroups = ko.observableArray([]);
    self.subGroupsVisible = ko.observable(false);


    self.showLightbox = function () {
        self.lightboxVisible(true);
    }

    self.hideLightbox = function () {
        self.subGroupsVisible(false);
    }

    self.backButtonClicked = function () {
        self.subGroupsVisible(false);
    }

    self.parentGroupClicked = function (itemClicked) {
        self.currentSubGroups = itemClicked.subGroups;
        self.subGroupsVisible(true);
    }

    $.post("/FirstTimeCheckin/GetGradeGroups", function (resp) {
        var data = resp.response.parentGroups;

        var colors = ['#F27474', '#8CD4F5', '#F8BB86', '#A5DC86'];
        for (var i = 0; i < data.length; i++) {
            self.gradeGroups.push(new ParentGroup(data[i], colors[i]));
        }
    });
}
