(function($, can, chrome){
	"use strict";


	window.backgroundPage = chrome.extension.getBackgroundPage();

	window.popup = {
		refreshTime:backgroundPage.kmj.getRefresh(),
		items:[],
		messages:{
			noIssues:"The filter ("+ backgroundPage.kmj.getLocalStore("PopupFilterID") +") is returning 0 issues!<br/>Click on the title above to check.",
			unknown:'Either your not logged in, or the connection failed for some reason :(',
			noConf:'Please check the <a href="options.html">configuration page</a>.'
		},
		init:function() {
			var manifest = chrome.runtime.getManifest(),
				filterUrl = backgroundPage.kmj.urlCleaner( backgroundPage.kmj.getLocalStore("JiraURL") + "/" + backgroundPage.kmj.getLocalStore("JiraFilterURL") + backgroundPage.kmj.getLocalStore("PopupFilterID") )
			popup.items = new can.Observe.List( backgroundPage.kmj.items );

			can.$("#template").html( backgroundPage.kmj.getLocalStore("PopupTemplate") );

			$("h1").html( '<a href="'+ filterUrl +'">'+ backgroundPage.kmj.getLocalStore("PopupTitle") +'</a>' );
			$("#refereshIcon").css("-webkit-animation-duration", popup.refreshTime +"ms");
			$("#extensionLink").text(manifest.name + ' ('+manifest.version+')')

			popup.render();
		},
		render:function(){
			var url = backgroundPage.kmj.getLocalStore("JiraURL"),
				html;

			if (popup.items.length) {
				var template = can.view("#template", {jira: popup.items });
				can.$("#display").append(template);

				$("#login").attr("href", url).text("JIRA");
			} else {
				if (url && backgroundPage.kmj.items.length === 0){
					html = popup.messages.noIssues;
				} else if (!url){
					html = popup.messages.noConf;
				} else {
					html = popup.messages.unknown;
				}
				$("p.message").empty().html( html );

				$("#login").attr("href", url).text("Login");
			}
		},
		monitor:function(){
			popup.items.replace(backgroundPage.kmj.items);
			$("body").removeClass("loading");
			if (popup.items.length === 0){
				var html = (backgroundPage.kmj.connected) ? popup.messages.noIssues : popup.messages.unknown;
				$("p.message").empty().html( html );
			}
		}
	}

	$(document).ready(function(){
		popup.init();
		var checking,
			mon;
		$("#refresh").on('click',function(){
			if (checking){
				clearTimout(checking);
			}
			$("body").addClass("loading");
			backgroundPage.kmj.init();
			checking = setTimout(function(){popup.monitor()}, 3000);
		});
		mon = setInterval(function(){popup.monitor()}, popup.refreshTime);
	});


})(window.$, window.can, window.chrome);