

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
	kanbanItems:[],
	kanbanFiterDocuments:[],
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
		if (kmj.httpRequest === null){// ignore if there is an active request, wait for it to complete first
			kmj.getPopupItems();
			kmj.getKanbanItems();
		}
		kmj.repeat = setTimeout(kmj.init, kmj.getLocalStore("RefreshTime") * 1000 * 60 )
	},
	urlCleaner:function( url ){
		var urlArr = url.split("://");
		if (urlArr.length > 1){
			return urlArr[0]+"://"+urlArr[1].replace(/\/+/g,'/');
		} else {
			return urlArr[0].replace(/\/+/g,'/') ;
		}
	},
	getCleanUrl:function( filterId ){
		if (TEST === true){
			return "lib/test/jira-filter.xml";
		}
		var url = kmj.getLocalStore("JiraURL") + "/" + kmj.getLocalStore("JiraAPI") + filterId +"/";
		return kmj.urlCleaner( url );
	},
	updateBrowserActionStatus:function(status, undefined) {
		kmj.log("updateBrowserActionStatus: update status: "+ status)
		status = (status < 0 || status === null || status === undefined) ? '?' : status ;
		chrome.browserAction.setBadgeText({text: status.toString() });
	},
	updateBrowserActionStatusPie:function(){

	},
	getPopupItems:function(){
		var url = kmj.getCleanUrl( kmj.getLocalStore("PopupFilterID") );
		kmj.items = [];
		kmj.httpRequest = $.ajax({
			type: 'GET',
			url: url,
			dataType:"xml",
			timeout: 20000,
			success: function(data){
				kmj.httpRequest = null;
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
		kmj.updateBrowserActionStatus(-1);
	},
	handleResponse:function(data){
		var XML = data // kmj.strToXml(responseText)
			, xmlItems;

		if ( XML.getElementsByTagName('item').length === 0 ) {
			kmj.updateBrowserActionStatus( 0 );
			return;
		}
		xmlItems = XML.getElementsByTagName('item');
		kmj.popuplateItems(xmlItems, kmj.items);
		kmj.updateBrowserActionStatus( kmj.items.length );
	},
	/**
	 * Method to loop through XML object and covert to JSON array.
	 * @id  popuplateItems
	 * @memberOf kmj
	 * @return void
	 *
	 */
	popuplateItems:function(xmlItems, items, ops){
		for (var i = 0, len = xmlItems.length; i < len; i++){
			var xml = xmlItems[i]
				, json = kmj.xmlToJson( xml, true );
			if (ops){
				for (var name in ops){
					json[name] = ops[name];
				}
			}
			items.push( json );
		}
	},
	/**
	 * Method to loop through kmj.kanbanFiterDocuments and build up the kmj.kanbanItems wall array.
	 * @id  buildKanbanItemsList
	 * @memberOf kmj
	 * @return void
	 *
	 */
	buildKanbanItemsList:function(){
		kmj.kanbanItems = [];
		for (var i = 0, filter, xmlItems, XML, len = kmj.kanbanFiterDocuments.length; i < len; i++ ){
			filter = kmj.kanbanFiterDocuments[i];
			XML = filter.xml;
			xmlItems = XML.getElementsByTagName('item');
			kmj.popuplateItems(xmlItems, kmj.kanbanItems, {
				kmjFilterId:filter.id
				,kmjColumnIndex:i
				,kmjUrl:kmj.urlCleaner( kmj.getLocalStore("JiraURL") + "/" + kmj.getLocalStore("TicketBaseURL") )
			});
		}
	},
	/**
	 * Method return the users jira filter list.
	 * @id  getKanbanFilterList
	 * @memberOf kmj
	 * @return Array
	 *
	 */
	getKanbanFilterList:function(){
		var rawData = kmj.getLocalStore("ColumnInfo",'[]'),
			filters = JSON.parse(rawData);
		for (var i = 0, n = filters.length; i < n; i++){
			filters[i].xmlUrl = kmj.getCleanUrl( filters[i].id );
			filters[i].url = kmj.urlCleaner( kmj.getLocalStore("JiraURL") + "/" + kmj.getLocalStore("JiraFilterURL") + filters[i].id );
		}
		return filters;
	},
	/**
	 * Method to loop through the jira filter ids and collect XML from server append to kmj.kanbanFiterDocuments.
	 * @id  getKanbanItems
	 * @memberOf kmj
	 * @return void
	 *
	 */
	getKanbanItems:function(){
		var filter = kmj.getKanbanFilterList(),
			deferred = can.Deferred(),
			onError = function(e){ kmj.updateBrowserActionStatus(-1);kmj.log( "getKanbanItems:error "+ e.message );  },
			onSuccess = function(){ kmj.buildKanbanItemsList(); }

		deferred.done(onSuccess);

		for (var i = 0, len = filter.length; i < len; i++ ){
			deferred.then(request(filter[i], len), onError)
		}

		function request(item, length){
			can.ajax({
				url : kmj.getCleanUrl( item.id ),
				type: 'GET',
				async : true,
				dataType: 'xml',
				success: function(data){
					kmj.log('ok got filter '+ item.id)
					kmj.kanbanFiterDocuments.push({
						id:item.id,
						title:item.title,
						xml:data
					})
					if (kmj.kanbanFiterDocuments.length === length){
						deferred.resolve();
					}
				},
				error: function(){deferred.reject( { message: 'Could not get filter: '+ item.id } )}
			})
		}
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

		if (xml.nodeType === 3) { // TEXT_NODE
			return xml.nodeValue.trim();
		}

		// recurse into children
		if (xml.hasChildNodes()) {
			for(var i = 0; i < xml.childNodes.length; i++) {
				var item = xml.childNodes.item(i);
				var nodeName = item.nodeName;
				if (nodeName.indexOf('@') > -1){
					throw new Error("XML format not supported");
				}
				if (obj[nodeName] === undefined) {
						if (item.childNodes.length){
							obj[nodeName] = item.firstChild.nodeValue.trim();
							if (preserveAttributes === true && item.attributes.length > 0){
								for (var j = 0; j < item.attributes.length; j++) {
									var attribute = item.attributes.item(j);
									obj[nodeName+'@'+attribute.nodeName] = attribute.nodeValue;
								}
							}
						} else {
							obj[nodeName] = kmj.xmlToJson(item, true);
						}
				} else if ( obj[nodeName] ) {
					if ( obj[nodeName].push === undefined) {
						var old = obj[nodeName];
						obj[nodeName] = [];
						obj[nodeName].push(old);
					}
					obj[nodeName].push( kmj.xmlToJson(item, true) );
				}
			}
		}
		return obj;
	}
}

kmj.init();