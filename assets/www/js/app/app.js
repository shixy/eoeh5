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
            J.Scroll(this).destroy();
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

            //动态设置最小宽度，否则iScroll横向滚动无法运行
            $nav.css('minWidth',categorys.length*100);
            navScroll = J.Scroll($navContainer);
            if(navScroll.scrollerW > navScroll.wrapperW){
                $scrollArrow.show();
            }else{
                $scrollArrow.hide();
            }
            //刷新slider
            slider.refresh();
            //刷新默认显示界面的scroller
            //J.Scroll($(LIST_SELECTOR).eq(0));
            J.hideMask();

            $(LIST_SELECTOR).each(function(){
                J.Refresh({
                    selector : this,
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
            });
        });
    }
});
App.page('detail',function(){
    var $container,$article;
    this.init = function(){
        $container = $('#detail_article  div.scrollWrapper');
        $article = $('#detail_article');
    }
    this.load = function(){
        if(!this.url){
            console.error('没有获取数据url');
        }
        $container.empty();
        J.showMask();
        EoeAPI.get(this.url,function(data){
            $container.html(data.response.content);
            J.Scroll($article);
            J.hideMask();
        });
    }

})