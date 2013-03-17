exports.Timer =  function(callback, delay) {
    var timerId, start, remaining = delay;

    this.pause = function() {
        clearTimeout(timerId);
        remaining -= new Date() - start;
    };
    this.resume = function() {
        start = new Date();
        timerId = setTimeout(callback, remaining);
    };
    this.resume();
}