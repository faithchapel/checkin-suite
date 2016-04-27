
(function () {

    this.IdleListenerManager = function () {
        var self = this;
        self.idleListeners = [];

        window.onmousemove = resetTimer;
        window.onmousedown = resetTimer;
        window.onclick = resetTimer;
        window.onscroll = resetTimer;
        window.onkeypress = resetTimer;

        function resetTimer() {
            for (var i = 0; i < self.idleListeners.length; i++) {
                self.idleListeners[i].reset();
            }
        }
    }

    IdleListenerManager.prototype.add = function (idleFunction, timeoutLength) {     
        this.idleListeners.push(new IdleListener(idleFunction, timeoutLength));
    }

    this.IdleListener = function (idleFunction, timeoutLength) {
        this.idleFunction = idleFunction;
        this.timeoutLength = timeoutLength;

        this.interval = setInterval(this.idleFunction, this.timeoutLength);
    }

    IdleListener.prototype.reset = function () {
       clearInterval(this.interval);
       this.interval = setInterval(this.idleFunction, this.timeoutLength);
    }

}());

