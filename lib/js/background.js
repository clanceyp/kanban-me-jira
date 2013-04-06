

chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
		// console.log(sender.tab ?
		//             "from a content script:" + sender.tab.url :
		//             "from the extension");
	});

$(document).on('ajaxBeforeSend', function(e, xhr, options){
	// This gets fired for every Ajax request performed on the page.
	// The xhr object and $.ajax() options are available for editing.
	// Return false to cancel this request.
	var auth = null,
		useAuth = kmj.getLocalStore("UseAuth");

	if (useAuth == "true"){
		auth = window.btoa((kmj.getLocalStore("username") || '') + ':' + (kmj.getLocalStore("password") || ''));
		xhr.setRequestHeader('Authorization', 'Basic ' + auth);
	}
})
/* TODO; re-factor legacy code, add comments and clean-up */
var kmj = {
	items:[],
	httpRequest:null, // main request for the popup, there should only be one of these
	getOptions:function(){
		if (!kmj.getLocalStore('loaded')){
			kmj.resetLocalStore();
			kmj.setLocalStore("loaded",true);
		}
		var ops = {};
		for (var key in DEFAULT_VALUES){
			ops[key] = kmj.getLocalStore(key);
		}
		return ops;
	},
	getLocalStore:function(key,defaultValue){
		var value = localStorage[key];
		key = key || "";
		if (value === undefined){
			value = DEFAULT_VALUES[key];
		}
		if (key.toLowerCase().indexOf("password") === 0){
			value = window.atob(value);
		}
		if (!value && defaultValue){
			value = defaultValue;
		}
		return value;
	},
	setLocalStore:function(key,value){
		if (key.toLowerCase().indexOf("password") === 0){
			value = window.btoa(value);
		}
		localStorage[key] = value;
        kmj.init();
	},
	resetLocalStore:function(){
		localStorage.clear();
		for (var key in DEFAULT_VALUES){
			localStorage[key] = DEFAULT_VALUES[key];
		}
        kmj.init();
	},
	log:function(message){
		if (DEBUG){
			console.log(message);
		}
	},
	init:function(){
		kmj.updateBrowserActionStatus(-1);
		kmj.log("init: "+ (kmj.getLocalStore("RefreshTime") * 1000 * 60) )
		if (kmj.repeat){
			clearTimeout(kmj.repeat);
		}
        if (kmj.checksoon){
            clearTimeout(kmj.checksoon);
        }
		if (kmj.httpRequest === null){// igonre if there is an active request, wait for it to complete first
			kmj.sendRequest();
		}
		kmj.repeat = setTimeout(kmj.init, kmj.getLocalStore("RefreshTime") * 1000 * 60 )
	},
	getCleanUrl:function(path){
		var url = kmj.getLocalStore("JiraURL") + "/" + kmj.getLocalStore("JiraAPI"),
			urlArr = url.split("://");
		if (urlArr.length > 1){
			return urlArr[0]+"://"+urlArr[1].replace(/\/+/g,'/') + path +"/";
		} else {
			return urlArr[0].replace(/\/+/g,'/') + path +"/";
		}
	},
	updateBrowserActionStatus:function(status) {
		kmj.log("updateBrowserActionStatus: update status: "+ status)
		status = (status && status > 0) ? status : '?' ;
		chrome.browserAction.setBadgeText({text: status.toString() });
	},
	updateBrowserActionStatusPie:function(){

	},
	sendRequest:function(){
		var url = kmj.getCleanUrl( kmj.getLocalStore("PopupFilterID") );
		kmj.httpRequest = $.ajax({
			type: 'GET',
			url: url,
			dataType:"xml",
			timeout: 20000,
			success: function(data){
				kmj.httpRequest = null;
				kmj.items = [];
				kmj.handleResponse(data);
			},
			error: function(xhr, type){
				kmj.httpRequest = null;
				kmj.handleResponseError(type);
			}
		})

	},
	handleResponseError:function(e){
		kmj.log(e);
		kmj.log("Something bad happened, maybe couldn't connect to JIRA?")
		kmj.items = [];
		kmj.httpRequest = null;
	},
	handleResponse:function(data){


		var XML = data // kmj.strToXml(responseText)
			, xmlItems;

		if ( XML.getElementsByTagName('item').length === 0 ) {
			kmj.checksoon = setTimeout(function(){
				kmj.httpRequest = null;
				kmj.init();
			},3000)
			return;
		}
		xmlItems = XML.getElementsByTagName('item');
		for (var i = 0, len = xmlItems.length; i < len; i++){
			var xml = xmlItems[i]
				, json = kmj.xmlToJson( xml );

			kmj.items.push( json );
		}
		kmj.updateBrowserActionStatus( kmj.items.length );


	},
	processStatus:function(topStatus){

	},
	strToXml:function(str){
		var DOMParser = kmj.DOMParser || new window.DOMParser;
		if (!kmj.DOMParser){
			kmj.DOMParser = DOMParser;
		}
		return DOMParser.parseFromString(str, "text/xml");
	},
	xmlToJson:function(xml, preserveAttributes, undefined) {

		// Create the return object
		var obj = {};

		if (xml.nodeType === 1 && preserveAttributes === true) { // ELEMENT_NODE
			// do attributes
			if (xml.attributes.length > 0) {
				obj["@attributes"] = {};
				for (var j = 0; j < xml.attributes.length; j++) {
					var attribute = xml.attributes.item(j);
					obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
				}
			}
		} else if (xml.nodeType === 3) { // TEXT_NODE
			return xml.nodeValue.trim();
		}

		// recurse into children
		if (xml.hasChildNodes()) {
			for(var i = 0; i < xml.childNodes.length; i++) {
				var item = xml.childNodes.item(i);
				var nodeName = item.nodeName;
				if (obj[nodeName] === undefined) {
						if (item.childNodes.length){
							obj[nodeName] = item.firstChild.nodeValue.trim();
						} else {
							obj[nodeName] = kmj.xmlToJson(item);
						}
				} else if ( obj[nodeName] ) {
					if ( obj[nodeName].push === undefined) {
						var old = obj[nodeName];
						obj[nodeName] = [];
						obj[nodeName].push(old);
					}
					obj[nodeName].push( kmj.xmlToJson(item) );
				}
			}
		}
		return obj;
	}
}

kmj.init();