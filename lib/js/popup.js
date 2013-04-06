var backgroundPage = chrome.extension.getBackgroundPage(),jobs = [];

function init() {

	var manifest = chrome.runtime.getManifest(),
		items = backgroundPage.kmj.items;

	can.$("#template").html( backgroundPage.kmj.getLocalStore("PopupTemplate") );
	$("h1").html(manifest.name);
	$("h2").html( backgroundPage.kmj.getLocalStore("PopupTitle") );

	$("#login").attr("href",backgroundPage.kmj.getLocalStore("JiraURL"));

	if (items && items.length) {
		var list = new can.Observe.List( items );
		var template = can.view("#template", {jira: list });
		can.$("#display").append(template);
	} else {
		if ($("p").length){
			$("p").html('Please check the <a href="options.html">configuration</a>.');
		} else {
			$("div").append('<p>Please check the <a href="options.html">configuration</a>.</p>');
		}
	}
}

$(document).ready(function(){
	init();
	$("#refresh").on('click',function(){
		backgroundPage.kmj.init();
	})



})