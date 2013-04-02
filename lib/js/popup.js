var backgroundPage,jobs = [];

function init() {
	backgroundPage = chrome.extension.getBackgroundPage();
	var manifest = chrome.runtime.getManifest();

	$("h1").html(manifest.name);
	$("#login").attr("href",backgroundPage.kmj.getLocalStore("JiraURL"));
	if (!backgroundPage.kmj.jobs || jobs.length === backgroundPage.kmj.jobs.length){
		return; // nothing has changed
	}
	jobs = backgroundPage.kmj.jobs;
	$("#display ul").empty()
	if (jobs && jobs.length) {
		for (var i = 0,job; i < jobs.length ; i++) {

		}
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

	})
})