
ko.extenders.forceFormatDate = function (target, precision) {
    function formatToDate(date) {
        if (date) {
            date = date.replace(/\D/g, ''); // removes all non-numeric

            var result = "";
            var first = date.substring(0, 2);
            if (first) {
                result += first;
            }

            var second = date.substring(2, 4);
            if (second) {
                result += "/" + second;
            }

            var third = date.substring(4, 8);
            if (third) {
                result += "/" + third;
            }
        }
        return result;
    }
    var result = ko.pureComputed({
        read: target,  //always return the original observables value
        write: function (newValue) {
            var current = target();
            var valueToWrite = formatToDate(newValue);

            //only write if it changed
            if (valueToWrite !== current) {
                target(valueToWrite);
            } else {
                //if the rounded value is the same, but a different value was written, force a notification for the current field
                if (newValue !== current) {
                    target.notifySubscribers(valueToWrite);
                }
            }
        }
    }).extend({ notify: 'always' });

    //initialize with current value to make sure it is rounded appropriately
    result(target());

    //return the new computed observable
    return result;
};

ko.bindingHandlers.holdClick = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        var timeoutId = 0;

        var option = valueAccessor() || {};

        $(element).mousedown(function () {
            timeoutId = setTimeout(option, 1000);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(timeoutId);
        });
    },
};