var GlobalValue = function () {
    function GlobalValue(value) {
        this.value = value;
        this.handlers = [];
    }

    GlobalValue.prototype.setValue = function(value) {
        this.value = value;
        this.handlers.forEach(function(handler) {
            if(typeof handler === "function") handler(value);
        });
    }

    GlobalValue.prototype.getValue = function() {
        return this.value;
    }

    GlobalValue.prototype.registerListener = function(handler) {
        this.handlers.push(handler);
    }

    GlobalValue.prototype.unregisterListener = function(handler) {
        let index = this.handlers.indexOf(handler);
        if(index >= 0) this.handlers.splice(index, 1);
    }

    return GlobalValue;
}();

var globalSingelton = (function() {
    function GlobalSingelton() {
        this.stiffness = new GlobalValue(0.01);
        this.cellSize = new GlobalValue(5.0);
        this.minThickness = new GlobalValue(0.4);
    }
    
    return GlobalSingelton;
  })();

module.exports = new globalSingelton;