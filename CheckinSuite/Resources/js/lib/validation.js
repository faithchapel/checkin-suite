
function validate(selector) {

    inputs = $("#" + selector + " :input:visible");

    var valid = true;

    inputs.each(function () {

        if ($(this).is(':visible') && !validateInput($(this))) {
            valid = false;
        }

    });

    return valid;

}

function validateIsSet(val) {
    return val.length > 0
}

function validateIsNumeric(val) {
    return !isNaN(parseFloat(val)) && isFinite(val);
}

function validateIsMaskedNumeric(val) {

    var test = replaceAll("X", "", val);

    return !isNaN(parseFloat(test)) && isFinite(test);
}

function validateMinLength(val, min) {
    return val.length >= min;
}

function validateMaxLength(val, max) {
    return val.length <= max;
}

function validateEmailAddress(val) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(val);
}

var cardType = "";

function validateCreditCard(val) {
    jQuery(function ($) {
        if ($.payment.validateCardNumber(val)) {
            cardType = $.payment.cardType(val);
            return true;
        } else {
            return false;
        }
    });
}

function validateCardExpiration(val) {
    return $.payment.validateCardExpiry(val)
}

function validateCardCVC(val) {
    return !$.payment.validateCardCVC(val, cardType)
}

function replaceAll(find, replace, str) {
    return str.replace(new RegExp(find, 'g'), replace);
}

function checkValidation(input) {

    var value = input.val();

    if (isDefined(input, "required") && !validateIsSet(value)) {
        return false;
    }

    if (isDefined(input, "data-numeric") && !validateIsNumeric(value)) {
        return false;
    }

    if (isDefined(input, "data-masked-numeric") && !validateIsMaskedNumeric(value)) {
        return false;
    }

    if (isDefined(input, "data-min-length") && !validateMinLength(value, input.attr("data-min-length"))) {
        return false;
    }

    if (isDefined(input, "data-max-length") && !validateMaxLength(value, input.attr("data-max-length"))) {
        return false;
    }

    if (isDefined(input, "data-email") && !validateEmailAddress(value)) {
        return false;
    }

    if (isDefined(input, "data-credit-card") && !validateCreditCard(value)) {
        return false;
    }

    if (isDefined(input, "data-credit-card-expiry") && !validateCardExpiration(value)) {
        return false;
    }

    if (isDefined(input, "data-credit-card-cvc") && !validateCardCVC(value)) {
        return false;
    }

    return true;

}

function isDefined(input, attribute) {
    return typeof input.attr(attribute) !== "undefined";
}

function validateInput(input) {

    var valid = checkValidation(input);

    if (!valid) {
        input.addClass("validation-error");
    } else {
        input.removeClass("validation-error");
    }

    return valid;

}