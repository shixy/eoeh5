window.EoeAPI = (function(){
    var _baseURL = "http://api.eoe.cn/client";
    this.topURL = _baseURL + '/top';
    this.blogURL = _baseURL + '/blog?k=lists';
    this.newsURL = _baseURL + '/news?k=lists';
    this.wikiURL = _baseURL + '/wiki?k=lists';
    this.get = function(url,success,error){
            url = url.replace('//client','/client');

            //判断当前是手机端(phonegap)还是浏览器端，手机端通过phonegap的白名单进行跨域，浏览器端采用nodejs进行跨域转发
            if(location.protocol == 'http:'){
                url = '/proxy?url='+url;
            }
            var options = {
                url : url,
                type : 'get',
                timeout : 120000,//超时时间默认2分钟
                success : success,
                error : function(xhr,type){
                    if(error){
                        error(xhr,type);
                    }else{
                        _parseError(xhr,type,url);
                    }
                },
                dataType : 'json'
            }
            $.ajax(options);
    }
    var _parseError = function (xhr,type,url){
        if(J.hasPopupOpen){
            J.hideMask();
        }
        if(type == 'timeout'){
            J.showToast('连接服务器超时,请检查网络是否畅通！','error');
        }else if(type == 'parsererror'){
            J.showToast('解析返回结果失败！','error');
        }else if(type == 'error'){
            var data;
            try{
                data = JSON.parse(xhr.responseText);
                if(data.code && data.message){
                    J.showToast(data.message,'error');
                }else{
                    J.showToast('连接服务器失败！','error');
                }
            }catch(e){
                J.showToast('连接服务器失败！','error');
            }
        }else{
            J.showToast('未知异常','error');
        }
    }

    this.login = function(username,pwd,success,error){
        var url = _baseURL + '/key?uname='+username+'&pwd='+pwd;
        this.get(url,success,error);
    }

    this.getUserInfo = function(key,success){
        var url = _baseURL + '/userinfo?key='+key;
        this.getWithSign(url,key,success);
    }
    this.getWithSign = function(url,key,success,error){
        var _this = this;
        url += '&uid=111790&nonce=3277deffc7&timestamp=1385627864322&api_sign=2a6efa2e44756e20dae68b724688f0ba';//web端测试
        _this.get(url,success);
//        window.plugins.eoeSign.get(key,function(param){
//            url += param;
//            _this.get(url,success,error);
//        });
    }



    return this;
})();
