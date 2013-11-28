(function(){
    if(!window.plugins) {
        window.plugins = {};
    }
    /**
     * 条码扫描
     * @type {Object}
     */
    window.plugins.barcodeScanner = {
        scan : function(mode,win,err){
            cordova.exec(win, err, "BarcodeScanner", "scan", [mode]);
        }
    }
    /**
     * 对key进行签名
     * @type {Object}
     */
    window.plugins.eoeSign = {
        get : function(key,win,err){
            cordova.exec(win, err, "Sign", "get", [key]);
        }
    }
})();
