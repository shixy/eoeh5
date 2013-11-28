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
            J.Router.turnTo(target);
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
            J.Router.turnTo('#detail_section');
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
    var $container;
    this.init = function(){
        $container = $('#detail_article  div.scrollWrapper');
    }
    this.load = function(){
        if(!this.url){
            console.error('没有获取数据url');
        }
        $container.empty();
        $('#detail_section header .title').text(this.title);
        J.showMask();
        EoeAPI.get(this.url,function(data){
            $container.html(data.response.content);
            J.Scroll('#detail_article');
            J.hideMask();
        });
    }
});
App.page('login',function(){
    this.callback;
    this.init = function(){
        $('#btn_login').tap(_login);
        $('#btn_qr_login').tap(_qr_login);
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
                    if(this.callback){//处理未登录时需要登录处理的后续操作
                        this.callback();
                    }else{
                        J.Router.turnTo('#user_section');
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
            var key = result.text;
            if(key.indexOf(':') == -1){
                J.showToast('二维码不正确，无法登录','error');
                return;
            }
            J.showMask('正在登录...');
            EoeAPI.getUserInfo(key,function(data){
                J.hideMask();
                if(data.response.isErr == 1){
                    J.showToast(data.response.msg,'error');
                }else{
                    App.page('user').userInfo = data;
                    App.authKey = key;
                    if(this.callback){//处理未登录时需要登录处理的后续操作
                        this.callback();
                    }else{
                        J.Router.turnTo('#user_section');
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
//        $('#num_blog_favo,#num_news_favo').on('tap',function(){
//            J.Router.turnTo('#favo_section');
//        });
        $('#btn_logout').on('tap',function(){
            localStorage.removeItem('authKey');
            _this.userInfo = null;
            J.Router.turnTo('#index_section');
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
            J.Router.turnTo('#detail_section');
        });
    }
    this.load = function(){
        var favo_data = App.page('user').userInfo.response.favorite;
        J.tmpl('#favo_blog_article .list','tpl_favo',favo_data[0].lists);
        J.tmpl('#favo_news_article .list','tpl_favo',favo_data[1].lists);
    }
});