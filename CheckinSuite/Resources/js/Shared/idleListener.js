;(function (ns) {

    var listeners = [];

    ns.add = function add(handler, timeout) {
        listeners.push({
            handler: handler,
            timeout: timeout,
            timer: setTimeout(handler, timeout)
        });
    }

    ns.reset = function reset() {
        listeners.forEach(function (listener) {
            clearTimeout(listener.timer);
            listener.timer = setTimeout(listener.handler, listener.timeout);
        });
    }

    document.addEventListener('click', ns.reset);
    document.addEventListener('mousemove', ns.reset);
    document.addEventListener('mousedown', ns.reset);
    document.addEventListener('keypress', ns.reset);

}(this.IdleListener = this.IdleListener || {}));