(function($, can, chrome, window){
	"use strict";


	var backgroundPage = chrome.extension.getBackgroundPage(),
        popup = {
            refreshTime:3000,// how often to check the background page for changes
            checkingCounter:0,
            items:[],
            messages:{
                noIssues:"The filter ("+ backgroundPage.kmj.getLocalStore("PopupFilterID") +") is returning 0 issues!<br/>Click on the title above to check.",
                unknown:'Either you are not <a class="login">logged in</a>, or the connection failed for some reason :(',
                noConf:'Please check the <a href="options.html">configuration page</a>.'
            },
            init:function() {
                var manifest = chrome.runtime.getManifest(),
                    filterUrl = backgroundPage.kmj.urlCleaner( backgroundPage.kmj.getLocalStore("JiraURL") + "/" + backgroundPage.kmj.getLocalStore("JiraFilterURL") + backgroundPage.kmj.getLocalStore("PopupFilterID") );
                popup.items = new can.Observe.List( backgroundPage.kmj.items );

                can.$("#template").html( backgroundPage.kmj.getLocalStore("PopupTemplate") );

                $("h1").html( '<a href="'+ filterUrl +'">'+ backgroundPage.kmj.getLocalStore("PopupTitle") +'</a>' );
                $("#refereshIcon").css("-webkit-animation-duration", popup.refreshTime +"ms");
                $("#extensionLink").text(manifest.name + ' ('+manifest.version+')');

                popup.render();
            },
            render:function(){
                var url = backgroundPage.kmj.getLocalStore("JiraURL"),
                    html;

                if (popup.items.length) {
                    var template = can.view("#template", {jira: popup.items });
                    can.$("#display").append(template);

                    $("footer a.login").attr("href", url).text("JIRA");
                } else {
                    if (backgroundPage.kmj.getLocalStore("JiraURL") === DEFAULT_VALUES["JiraURL"]){
                        html = popup.messages.noConf;
                    } else if (backgroundPage.kmj.items.length === 0 && backgroundPage.kmj.connected === true){
                        html = popup.messages.noIssues;
                    } else {
                        html = popup.messages.unknown;
                    }
                    $("p.message").empty().html( html );
                    $("a.login").attr("href", url);
                    $('footer a.login').text("Login");
                }
            },
            monitor:function(){
                if (backgroundPage.kmj.items.length === 0 && popup.checkingCounter < 5){
                    popup.checkingCounter ++ ;
                    popup.checking = window.setTimout(function(){popup.monitor();}, popup.refreshTime);
                    return;
                }
                popup.checkingCounter = 0;
                if (backgroundPage.kmj.items.length !== popup.items.length){/* don't refresh unless something has been added or removed */
                    popup.items.replace(backgroundPage.kmj.items);
                }
                $("body").removeClass("loading");
                if (backgroundPage.kmj.items.length === 0){
                    var html = (backgroundPage.kmj.connected) ? popup.messages.noIssues : popup.messages.unknown;
                    $("p.message").empty().html( html );
                    popup.items.replace(backgroundPage.kmj.items);
                }
            }
        };

    $(window).on('load', function(){
        popup.init();
        var mon;
        $("#refresh").on('click',function(){
            popup.checkingCounter = 0;
            if (popup.checking){
                window.clearTimout(popup.checking);
            }
            $("body").addClass("loading");
            backgroundPage.kmj.init();
            popup.checking = window.setTimout(function(){popup.monitor();}, popup.refreshTime);
        });
        mon = setInterval(function(){popup.monitor();}, popup.refreshTime);
        window.popup = popup;
        window.backgroundPage = backgroundPage;
    });


})(window.$, window.can, window.chrome, window);