(function($, can, chrome){
	"use strict";


	window.backgroundPage = chrome.extension.getBackgroundPage();

	window.popup = {
		checkTimeout:3000,
		items:[],
		init:function() {
			var manifest = chrome.runtime.getManifest();
			popup.items = new can.Observe.List( backgroundPage.kmj.items );

			can.$("#template").html( backgroundPage.kmj.getLocalStore("PopupTemplate") );

			$("h1").html( backgroundPage.kmj.getLocalStore("PopupTitle") );
			$("#refereshIcon").css("-webkit-animation-duration", popup.checkTimeout +"ms");
			$("#extensionLink").text(manifest.name + ' ('+manifest.version+')')

			popup.render();
		},
		render:function(){
			var url = backgroundPage.kmj.getLocalStore("JiraURL");

			if (popup.items.length) {
				var template = can.view("#template", {jira: popup.items });
				can.$("#display").append(template);

				$("#login").attr("href", url).text("JIRA");
			} else {
				var html = (url) ? 'Please <a href="'+ url +'">login</a> and/or check the <a href="options.html">options</a> page.' : 'Please check the <a href="options.html">configuration22</a>.';
				$("p.message").empty().html( html );

				$("#login").attr("href", url).text("Login");
			}
		},
		monitor:function(){
			if (backgroundPage.kmj.items.length > 0 && (backgroundPage.kmj.items.length !== popup.items.length) ){
				popup.items.splice(0, popup.items.length);
				for(var i = 0, len = backgroundPage.kmj.items.length; i < len; i++){
					popup.items.push( backgroundPage.kmj.items[i]  );
				}
				$("body").removeClass("loading");
			}
		}
	}

	$(document).ready(function(){
		popup.init();
		$("#refresh").on('click',function(){
			clearInterval(mon);
			popup.items.splice(0, popup.items.length);
			$("body").addClass("loading");
			backgroundPage.kmj.init();
			mon = setInterval(function(){popup.monitor()}, popup.checkTimeout);
		});
		var mon = setInterval(function(){popup.monitor()}, popup.checkTimeout);
	});


})(window.$, window.can, window.chrome);