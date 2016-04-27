function redirectWithPreserve(url) {
    var splitUrl = window.location.href.split('?');

    var a = url + "?" + splitUrl[1];
    window.location = url + "?" + splitUrl[1];

}