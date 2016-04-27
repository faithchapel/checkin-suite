function ItemRoot(data, itemClickedFunction, viewModel) {
    // keeps track of the current item
    this.currentItem = ko.observable(this);

    this.viewModel = viewModel; // for when we need to close the lightbox

    this.isRoot = true; // used for displaying back button

    this.itemClickedFunction = itemClickedFunction; // will be a knockout observable

    this.title = ko.observable(data.title);

    this.items = ko.observableArray([]);
    if (data.items) {
        for (var i = 0; i < data.items.length; i++) {
            this.items.push(new Item(data.items[i], this, this)); // in this situation the parent is the root
        }
    }
}

function Item(data, root, parent) {
    var self = this;

    self.isRoot = false; // used for displaying back button

    // will be null if doesn't exsist
    self.title = ko.observable(data.title);
    self.value = ko.observable(data.value);

    if (data.color) {
        self.color = ko.observable(data.color);
    } else if (parent.color) {
        self.color = ko.observable(parent.color());
    } else {
        self.color = ko.observable("#A9A9A9");
    }
   
    self.parent = parent;

    if (data.items){
        self.items = ko.observableArray([]);
        for (var i = 0; i < data.items.length; i++) {
            self.items.push(new Item(data.items[i], root, self));
        }
    }
    
    self.itemClicked = function () {
        if (self.items && self.items().length > 0){
            root.currentItem(this);
        } else {
            root.viewModel.itemClickedFunction(self.value());
            root.viewModel.buttonText(self.title());
            root.viewModel.buttonColor(self.color());

            root.viewModel.hideLightbox();
        }
    }
}

function LightboxSelect(data, itemClickedFunction) {
    var self = this;
    self.rootTitle = data.title;
    self.itemRoot = ko.observable(new ItemRoot(data, self.itemClickedFunction, self));

    self.itemClickedFunction = itemClickedFunction;
    self.buttonText = self.itemRoot().title;
    self.buttonColor = ko.observable();
    
    self.isVisible = ko.observable(false);

    self.isLowerLevel = ko.computed(function () {
        if (self.itemRoot().currentItem().isRoot) {
            return false;
        } else {
            return true;
        }
    });

    self.showLightbox = function () {
        self.isVisible(true);
    }

    self.hideLightbox = function () {
        self.isVisible(false);
        self.itemRoot().currentItem(self.itemRoot());
    }

    self.backButtonClicked = function () {
        self.itemRoot().currentItem(self.itemRoot().currentItem().parent);
    }

    self.addData = function (data) {
        self.itemRoot(new ItemRoot(data, self.requesterVariable, self));
        self.buttonText(data.title);
    }

    self.resetData = function () {
        self.buttonText(self.rootTitle);
        self.buttonColor("");
    }
}