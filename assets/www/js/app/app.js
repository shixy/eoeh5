document.addEventListener('deviceready', onDeviceReady, false);
function onDeviceReady(){
    //注册后退按钮
    document.addEventListener("backbutton", function (e) {
        if(J.isMenuOpen){
            J.Menu.hide();
        }else if(J.hasPopupOpen){
            J.closePopup();
        }else{
			
            var sectionId = $('section.active').attr('id');
            if(sectionId == 'index_section'){
                J.confirm('提示','是否退出程序？',function(){
                    navigator.app.exitApp();
                });
            }else{
                J.Router.back();
            }
        }
    }, false);
    App.run();
    navigator.splashscreen.hide();
}
var App = (function(){
    var pages = {};
    var run = function(){
        $.each(pages,function(k,v){
            var sectionId = '#'+k+'_section';
            $('body').delegate(sectionId,'pageinit',function(){
                v.init && v.init.call(v);
            });
            $('body').delegate(sectionId,'pageshow',function(e,isBack){
                //页面加载的时候都会执行
                v.show && v.show.call(v);
                //后退时不执行
                if(!isBack && v.load){
                    v.load.call(v);
                }
            });
        });
        Jingle.launch({
            showWelcome:false
        });
        J.anim('body','scaleIn');
    };
    var page = function(id,factory){
        return ((id && factory)?_addPage:_getPage).call(this,id,factory);
    }
    var _addPage = function(id,factory){
        pages[id] = new factory();
    };
    var _getPage = function(id){
        return pages[id];
    }

    return {
        run : run,
        page : page
    }
}());
if(J.isWebApp){
    $(function () {
        App.run();
    })
}

App.page('index',function(){
    var slider,$navContainer,$nav,navScroll,$scrollArrow;
    var LIST_SELECTOR = '#index_article .list-container';
    var _this = this;
    this.init = function(){
        //缓存使用频繁的element
        $navContainer = $('#index_section .header-secondary');
        $nav = $navContainer.find('div.grid');
        $scrollArrow = $nav.next();

        //绑定左侧划出菜单点击事件
        $('#index_aside .menu li a').on('tap',function(){
            if($(this).hasClass('selected'))return;
            $('#index_aside .menu li a').removeClass('selected');
            $(this).addClass('selected');
            var url = EoeAPI[$(this).data('url')];
            J.Menu.hide();
            _this.refresh($(this).text(),url);
        });
        $('#btn_show_user').on('tap',function(){
            var key = localStorage.getItem('authKey');
            var target = key ? '#user_section' : '#login_section';
            J.Router.goTo(target);
        });
        //初始化导航栏iScroll
        navScroll = J.Scroll($navContainer,{vScroll:false,hScroll:true,hScrollbar: false});
        //初始化页面滑动slider
        slider = new J.Slider({
            selector:'#index_article',
            noDots : true,
            onAfterSlide : function(i){
                var targetScrollEl = $navContainer.find('a').removeClass('active').eq(i).addClass('active').prev();
                if(targetScrollEl.length>0){
                    navScroll.scroller.scrollToElement(targetScrollEl[0]);
                }
            }
        });
        //绑定导航栏点击事件
        $navContainer.on('tap','a',function(){
            slider.index($(this).data('index'));
        });
        //绑定加载更多按钮事件
        $('#index_article').on('tap','.list-container button',function(){
            var $this = $(this);
            var $container = $this.closest('.list-container');
            var more_url = $this.data('url');
            $this.text('加载中...');
            EoeAPI.get(more_url,function(data){
                J.tmpl($container.find('ul'),'tpl_article_list_li',data.response.items,'add');
                J.Scroll($container);
                $this.text('点击加载更多');
                $this.data('url',data.response.more_url);
            });
        });
        $('#index_article').on('tap','.list-container li',function(){
           var url = $(this).data('url');
            if(!url)return;
            App.page('detail').url = url;
            App.page('detail').title = $(this).closest('ul.list').data('name');
            J.Router.goTo('#detail_section');
        });
        //init
        this.refresh('社区精选',EoeAPI.topURL);
    };
    this.refresh = function(title,url){
        $('#index_section header .title').text(title);
        J.showMask();
        //先销毁掉页面中的iscroll
        $(LIST_SELECTOR).each(function(){
            if($(this).data('_jrefresh_')){
                J.Refresh(this).destroy();
            }

        });
        EoeAPI.get(url,function(data){
            var categorys = data.response.categorys;
            var list = data.response.list;

            //eoe api这个接口数据混乱，需手动调整
            if(title == '社区精选'){
                list[0].name = '精选资讯';
                list[1].name = '精选教程';
            }
            //整理接口返回的数据
            for(var i=0;i<list.length;i++){
                for(var j = 0;j<categorys.length;j++){
                    if(list[i].name == categorys[j].name){
                        list[i].url = categorys[j].url;
                    }
                }
            }
            //渲染模板
            J.tmpl($nav,'tpl_category',list);
            J.tmpl('#index_article>div','tpl_article_list',list);

            //刷新slider
            slider.refresh();

            //动态设置最小宽度，否则iScroll横向滚动无法运行
            $nav.css('minWidth',categorys.length*100);
            navScroll = J.Scroll($navContainer);
            if(navScroll.scroller.scrollerW > navScroll.scroller.wrapperW){
                $scrollArrow.show();
            }else{
                $scrollArrow.hide();
            }
            $(LIST_SELECTOR).each(function(){
                _initPullRefresh(this);
            });
            //刷新默认显示界面的scroller
            J.Scroll($(LIST_SELECTOR).eq(0));
            J.hideMask();
        });
    }
    var _initPullRefresh = function(selector){
        J.Refresh({
            selector : selector,
            type : 'pullDown',
            pullText : '你敢往下拉么...',
            releaseText : '松手吧，骚年*^_^* ',
            callback : function(){
                var scroller = this;
                var $wrapper = $(scroller.wrapper);
                EoeAPI.get($wrapper.data('url'),function(data){
                    J.tmpl($wrapper.find('ul'),'tpl_article_list_li',data.response.items);
                    scroller.refresh();
                    J.showToast('更新成功','success');
                });
            }
        });
    }
});
App.page('detail',function(){
    var $container,baseUrl;
    this.init = function(){
        $container = $('#detail_article div.scrollWrapper');
        $('#detail_section footer a').on('tap',function(){
            _bindBar($(this));
        });
        $('#detail_section').on('pagehide',function(e,isBack){
            if(isBack)$container.empty();
        });
    }
    this.load = function(){
        if(!this.url){
            console.error('没有获取数据url');
        }
        $('#detail_section header .title').text(this.title);
        J.showMask();
        EoeAPI.get(this.url,function(data){
            var $content = $(data.response.content).filter('div.show');
            $container.html($content);
            $container.find('base').remove();
            _renderBar(data.response);
            J.Scroll('#detail_article');
            J.hideMask();
        });
    }
    var _renderBar = function(data){
        var bar = data.bar;
        var $good = $('#btn_userlike_good').data('url',bar.userlike.good);
        var $bad = $('#btn_userlike_bad').data('url',bar.userlike.bad);
        var $favo = $('#btn_user_favo').data('url',bar.favorite);
        $('#comment_num').text(data.comment_num);
        $('#btn_user_comment').data('url',bar.comment.get).data('submit',bar.comment.submit);
        var good = localStorage.getItem('good-group')|| '';
        var bad = localStorage.getItem('bad-group') || '';
        var favo = localStorage.getItem('favo-group') || '';
        baseUrl = data.share_url;
        good.indexOf(baseUrl)>-1 ? $good.addClass('active-bar'):$good.removeClass('active-bar');
        bad.indexOf(baseUrl)>-1 ? $bad.addClass('active-bar'):$bad.removeClass('active-bar');
        favo.indexOf(baseUrl)>-1 ? $favo.addClass('active-bar'):$favo.removeClass('active-bar');
    }
    /**
     * 绑定每个按钮的点击事件
     * @param bar
     * @private
     */
    var _bindBar = function(bar){
        var id = bar.attr('id');
        var url = bar.data('url');
        var key = localStorage.getItem('authKey');
        if(id == 'btn_user_comment'){
            App.page('comment').getUrl = url;
            App.page('comment').submitUrl = bar.data('submit');
            J.Router.goTo('#comment_section');
        }else{
            var isActive = bar.hasClass('active-bar');
            var save_t = bar.data('save');
            var storage = localStorage.getItem(save_t) || '';
            if(isActive){
                url = url.replace('add','del');
            }
            if(!key){
                App.page('login').turnBack = true;
                J.Router.goTo('#login_section');
                return;
            }
            EoeAPI.getWithSign(url,key,function(){
                bar.toggleClass('active-bar');
                if(isActive){//从本地存储中移除
                    storage = storage.replace(baseUrl,'');
                }else{//添加到本地
                    storage += baseUrl;
                }
                localStorage.setItem(save_t,storage);
            });
        }
    }
});
App.page('login',function(){
    var _this = this;
    this.turnBack = false;
    this.init = function(){
        $('#btn_login').tap(_login);
        $('#btn_qr_login').tap(_qr_login);
        $('#login_section').on('pagehide',function(){
            _this.turnBack = false;
        })
    }
    var _login = function(){
        var username = $('#username').val();
        var pwd = $('#password').val();
        if(username == '' || pwd == ''){
            J.alert('提示','请填写完整的信息！');
        }else{
            J.showMask('登录中...');
            EoeAPI.login(username,pwd,function(data){
                J.hideMask();
                var key = data.response.key;
                if(key){
                    localStorage.setItem('authKey',key);
                    if(_this.turnBack){//处理未登录时需要登录处理的后续操作
                        J.Router.back();
                    }else{
                        J.Router.goTo('#user_section');
                    }
                }else{
                    $('#password').val('');
                    J.showToast(data.response.msg,'error');
                }
            })
        }
    }
    var _qr_login = function(){
        window.plugins.barcodeScanner.scan('',function(result){
            if(result.cancelled)return;
            var key = result.text;
            if(key.indexOf(':') == -1){
                J.showToast('二维码不正确，无法登录','error');
                return;
            }
            J.showMask('正在登录...');
            EoeAPI.getUserInfo(key,function(data){
                J.hideMask();
                if(data.response.isErr === 1){
                    J.showToast(data.response.msg,'error');
                }else{
                    localStorage.setItem('authKey',key);
                    App.page('user').userInfo = data;
                    if(_this.turnBack){//处理未登录时需要登录处理的后续操作
                        J.Router.back();
                    }else{
                        J.Router.goTo('#user_section');
                    }
                }
            });
        })
    }
});
App.page('user',function(){
    var _this = this;
    this.userInfo = null;
    this.init = function(){
        var _this = this;
        $('#btn_logout').on('tap',function(){
            localStorage.removeItem('authKey');
            _this.userInfo = null;
            J.Router.goTo('#index_section');
        });
    }
    this.load = function(){
        if(this.userInfo){
            _render(this.userInfo);
        }else{
            _update();
        }
    }
    var _update = function(){
        var key = localStorage.getItem('authKey');
        EoeAPI.getUserInfo(key,_render);
    }
    var _render = function(data){
        _this.userInfo = data;
        data = data.response;
        $('#user_icon').attr('src',data.info.head_image_url);
        $('#txt_username').text(data.info.name);
        $('#user_eoe_m').text(data.info.eoe_m);
        $('#user_eoe_p').text(data.info.eoe_p);
        $('#num_blog_favo').text(data.favorite[0].lists.length);
        $('#num_news_favo').text(data.favorite[1].lists.length);
    }
});
App.page('favo',function(){
    this.init = function(){
        $('#favo_section .list').on('tap','li',function(){
            App.page('detail').url = $(this).data('url');
            App.page('detail').title = $(this).closest('ul.list').data('name');
            J.Router.goTo('#detail_section');
        });
    }
    this.load = function(){
        var favo_data = App.page('user').userInfo.response.favorite;
        J.tmpl('#favo_blog_article .list','tpl_favo',favo_data[0].lists);
        J.tmpl('#favo_news_article .list','tpl_favo',favo_data[1].lists);
    }
});
App.page('comment',function(){
    var $list,$btnMore,moreUrl,$submit_container,$btn_login;
    var _this = this;
    this.getUrl = null;
    this.submitUrl = null;
    this.init = function(){
        $list = $('#comment_article .list');
        $btnMore = $list.next();
        $submit_container = $('#comment_submit_container');
        $btn_login = $('#btn_comment_login');
        $btnMore.on('tap',function(){
            if(!moreUrl)return;
            _renderList();
        });
        $btn_login.on('tap',function(){
            App.page('login').turnBack = true;
            J.Router.goTo('#login_section');
        });
        $('#btn_submit_comment').on('tap',function(){
            var v = $('#input_comment').val();
            if($.trim(v)==''){
                J.showToast('评论不能为空');
                return;
            }
            var url = _this.submitUrl + '&body='+v;
            var key = localStorage.getItem('authKey');
            J.showMask('正在提交');
            EoeAPI.getWithSign(url,key,function(data){
                J.hideMask();
                if(data.response.isErr == 1){
                    J.showToast('评论失败','error');
                    return;
                }else{
                    var html = template('tpl_comment',[data.response.item]);
                    $list.prepend(html);
                    J.Scroll('#comment_article').scrollTo(0,0,0);
                    J.showToast('评论成功','success');
                }
            });
        });
    }
    this.show = function(){
        var key = localStorage.getItem('authKey');
        if(key){
            $submit_container.show();
            $btn_login.hide();
        }else{
            $submit_container.hide();
            $btn_login.show();
        }
    }
    this.load = function(){
        _renderList(true);
    }
    var _renderList = function(showMask){
        if(showMask){
            moreUrl = null;
            J.showMask();
        }else{
            $btnMore.text('加载中...');
        }
        EoeAPI.get(moreUrl||_this.getUrl,function(data){
            moreUrl = data.response.more_url;
            if(!moreUrl)$btnMore.hide();
            if(data.response.items == ''){
                J.Template.background($list,'亲，沙发还木有人哦..','drawer');
                J.hideMask();
                return;
            }
            J.tmpl($list,'tpl_comment',data.response.items,showMask?'replace':'add');
            if(data.response.more_url){
                $btnMore.show();
            }else{
                $btnMore.hide();
            }
            J.Scroll('#comment_article');
            if(showMask){
                J.hideMask();
            }else{
                $btnMore.text('点击加载更多');
            }
        });
    }
});
//日期格式化
Date.prototype.format = function(fmt)
{ //author: meizz
    var o = {
        "M+" : this.getMonth()+1,                 //月份
        "d+" : this.getDate(),                    //日
        "h+" : this.getHours(),                   //小时
        "m+" : this.getMinutes(),                 //分
        "s+" : this.getSeconds(),                 //秒
        "q+" : Math.floor((this.getMonth()+3)/3), //季度
        "S"  : this.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt))
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)
        if(new RegExp("("+ k +")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    return fmt;
}
//注册方法到artTemplate中
template.helper('dateFormat',function(time){
    return new Date(parseInt(time)).format('yyyy-MM-dd hh:mm:ss');
});