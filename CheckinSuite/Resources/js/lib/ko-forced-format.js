ko.extenders.forceFormat = function (target, data) {
    target.pattern = data;

    function replace(remainingString, pattern) {
        pattern = pattern.split('');
        var index = pattern.indexOf("#");
        if (index > -1) {
            pattern[index] = remainingString.charAt(0);
            remainingString = remainingString.substring(1, remainingString.length);
            if (remainingString.length > 0) {
                return replace(remainingString, pattern.join(''));
            } else {
                return pattern.join('').substring(0, index + 1);
            }
        }
        return pattern.join('');
    }


    function fomatPattern(value, pattern) {
        if (value) {
            var characters = pattern.replace(/#/g, "");
            value = value.replace(new RegExp("[" + characters + "]", 'gi'), "");
            if (value) {
                return replace(value, pattern);
            }
        }
    }

    var result = ko.pureComputed({
        read: target,
        write: function (newValue) {
            var current = target();
            var valueToWrite = fomatPattern(newValue, target.pattern);

            if (valueToWrite !== current) {
                target(valueToWrite);
            } else {
                if (newValue !== current) {
                    target.notifySubscribers(valueToWrite);
                }
            }
        }
    }).extend({ notify: 'always' });

    result(target());

    return result;
};
