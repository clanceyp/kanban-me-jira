(function($, can, chrome){
	"use strict";


	window.backgroundPage = chrome.extension.getBackgroundPage();

	function init() {

		var manifest = chrome.runtime.getManifest(),
			items = backgroundPage.kmj.items,
			url = backgroundPage.kmj.getLocalStore("JiraURL");

		can.$("#template").html( backgroundPage.kmj.getLocalStore("PopupTemplate") );

		$("h1").html( backgroundPage.kmj.getLocalStore("PopupTitle") );
		$("#extensionLink").text(manifest.name + ' ('+manifest.version+')')



		if (items && items.length) {
			var list = new can.Observe.List( items );
			var template = can.view("#template", {jira: list });
			can.$("#display").append(template);

			$("#login").attr("href", url).text("JIRA");
		} else {
			var html = (url) ? 'Please <a href="'+ url +'">login</a> and/or check the <a href="options.html">options</a> page.' : 'Please check the <a href="options.html">configuration22</a>.';
			$("p.message").empty().html( html );

			$("#login").attr("href", url).text("Login");
		}
	}

	$(document).ready(function(){
		init();
		$("#refresh").on('click',function(){
			init();
			backgroundPage.kmj.init();
		});
	});


})(window.$, window.can, window.chrome);