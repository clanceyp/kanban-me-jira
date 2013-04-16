

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
	/**
	 * Method, returns a value for a given key. checks; localstore, DEFAULT_VALUES and defaultValue
	 * @id getRefresh
	 * @memberOf kmj
	 * @param {string} value Optional can take a string value for testing
	 * @param {number} value Optional can take a number value for testing
	 * @return {number}
	 */
	getRefresh:function(value){
		value = value || kmj.getLocalStore("RefreshTime");
		return parseInt(value, 10) * 1000;
	},
	/*getOptions:function(){
		if (!kmj.getLocalStore('loaded')){
			kmj.resetLocalStore();
			kmj.setLocalStore("loaded",true);
		}
		var ops = {};
		for (var key in DEFAULT_VALUES){
			ops[key] = kmj.getLocalStore(key);
		}
		return ops;
	},*/
	/**
	 * Method, returns a value for a given key. checks; localstore, DEFAULT_VALUES and defaultValue
	 * @id getLocalStore
	 * @memberOf kmj
	 * @param {string} key The key to search for
	 * @param {string} defaultValue Fallback value if required
	 * @return {string}
	 */
	getLocalStore:function(key,defaultValue){
		var value = localStorage[key] || DEFAULT_VALUES[key] || defaultValue || null;

		if (value && key.toLowerCase().indexOf("password") === 0){
			value = window.atob(value);
		}
		return value;
	},
	/**
	 * Method, sets the value for a given key value pair in the localStore
	 * @id setLocalStore
	 * @memberOf kmj
	 * @param {string} key The key to set
	 * @param {string} value The value to set
	 * @return void
	 */
	setLocalStore:function(key,value){
		if (key.toLowerCase().indexOf("password") === 0){
			value = window.btoa(value);
		}
		localStorage[key] = value;
        kmj.init();
	},
	/**
	 * Method, resets the localStore, to default value, and re-runs the kmj.init method
	 * @id resetLocalStore
	 * @memberOf kmj
	 * @param {string} key Optional, if provided just resets the key item
	 * @param {string} defaultValue Optional, if a key was provided
	 * @return void
	 */
	resetLocalStore:function(key, defaultValue, undefined){
		if (key === undefined){
			resetAll();
		} else {
			localStorage.removeItem( key );
			if (DEFAULT_VALUES[key]){
				localStorage[key] = DEFAULT_VALUES[key];
			} else if (defaultValue){
				localStorage[key] = defaultValue;
			}
		}

		function resetAll(){
			localStorage.clear();
			for (var key in DEFAULT_VALUES){
				localStorage[key] = DEFAULT_VALUES[key];
			}
		}
        kmj.init();
	},
	/**
	 * Method, writes messages to the console if the const DEBUG is true
	 * @id log
	 * @memberOf kmj
	 * @param {string} message The output to write to the console
	 * @return void
	 */
	log:function(message){
		if (DEBUG){
			console.log(message);
		}
	},
	/**
	 * Method, starts the background page
	 * @id init
	 * @memberOf kmj
	 * @return void
	 */
	init:function(undefinded){
		if (window.jasmine !== undefinded){
			return;
		}
		if (!kmj.xmlToJson){
			setTimeout(function(){ kmj.init(); },1000);
		}
		kmj.updateBrowserActionStatus(-1);
		kmj.log("init: "+ kmj.getRefresh()  )
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
		kmj.repeat = setTimeout(kmj.init, kmj.getRefresh() )
	},
	/**
	 * Method, removes double slashes e.g. 'blah///blah//blah.html' => 'blah/blah/blah.html'
	 * @id urlCleaner
	 * @memberOf kmj
	 * @param {string} url The url to be cleaned
	 * @return {string}
	 */
	urlCleaner:function( url ){
		var urlArr = url.split("://");
		if (urlArr.length > 1){
			return urlArr[0]+"://"+urlArr[1].replace(/\/+/g,'/');
		} else {
			return urlArr[0].replace(/\/+/g,'/') ;
		}
	},
	/**
	 * Method, returns the cleaned filter
	 * @id getCleanUrl
	 * @memberOf kmj
	 * @param {number} filterId The id of the JIRA filter
	 * @return {string}
	 */
	getCleanUrl:function( filterId ){
		if (TEST === true || window['jasmineUseLocalXML'] === true){
			var id = (TEST_USE_FILTERID) ? '.'+ filterId : '';
			return 'lib/test/jira-filter'+id+'.xml';
		}
		var url = kmj.getLocalStore("JiraURL") + "/" + kmj.getLocalStore("JiraAPI") + filterId +"/";
		return kmj.urlCleaner( url );
	},
	/**
	 * Method, sets the browser icon text
	 * @id updateBrowserActionStatus
	 * @memberOf kmj
	 * @param {number} status The current status
	 * @return void
	 */
	updateBrowserActionStatus:function(status, undefined) {
		kmj.log("updateBrowserActionStatus: update status: "+ status)
		status = (status < 0 || status === null || status === undefined) ? '?' : status ;
		return chrome.browserAction.setBadgeText({text: status.toString() });
	},
	/**
	 * Method, gets the main filter for the popup display from the users JIRA instance
	 * @id getPopupItems
	 * @memberOf kmj
	 * @return void
	 */
	getPopupItems:function(testUrl){
		var url = testUrl || kmj.getCleanUrl( kmj.getLocalStore("PopupFilterID") );
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
	/**
	 * Method, generic httprequest error handler
	 * @id handleResponseError
	 * @memberOf kmj
	 * @param {error} e The error
	 * @return void
	 */
	handleResponseError:function(e){
		kmj.log(e);
		kmj.log("Something bad happened, maybe couldn't connect to JIRA?")
		kmj.items = [];
		kmj.httpRequest = null;
		kmj.updateBrowserActionStatus(-1);
	},
	/**
	 * Method, generic httprequest response handler
	 * @id handleResponse
	 * @memberOf kmj
	 * @param {object} data The response data
	 * @return void
	 */
	handleResponse:function(data){
		var XML = data // kmj.strToXml(responseText)
			, xmlItems;

		if ( XML.getElementsByTagName('item').length === 0 ) {
			kmj.updateBrowserActionStatus( 0 );
			return;
		}
		xmlItems = XML.getElementsByTagName('item');
		kmj.popuplateItems(xmlItems, kmj.items, {
			kmjUrl:kmj.urlCleaner( kmj.getLocalStore("JiraURL") + "/" + kmj.getLocalStore("TicketBaseURL") )
		});
		kmj.updateBrowserActionStatus( kmj.items.length );
	},
	/**
	 * Method to loop through XML items and covert to an array of JSON objects.
	 * @id  popuplateItems
	 * @memberOf kmj
	 * @param {array} xmlItems The xml items array
	 * @param {array} items The items array to populate
	 * @param {object} ops Object containing options to extend the child items
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
				,kmjColumnIndex:filter.filterIndex
				,kmjUrl:kmj.urlCleaner( kmj.getLocalStore("JiraURL") + "/" + kmj.getLocalStore("TicketBaseURL") )
			});
		}
	},
	/**
	 * Method return the users jira filter list.
	 * @id  getKanbanFilterList
	 * @memberOf kmj
	 * @return {array}
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
			deferred.then(request(filter[i], i, len), onError)
		}

		function request(item, i, length){
			can.ajax({
				url : kmj.getCleanUrl( item.id ),
				type: 'GET',
				async : true,
				dataType: 'xml',
				success: function(data){
					kmj.log('ok got filter '+ item.id)
					kmj.kanbanFiterDocuments.push({
						id:item.id,
						filterIndex:i,
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
	/**
	 * Method coverts string into XML
	 * @id  strToXml
	 * @memberOf kmj
	 * @depricated
	 * @return {object}
	 *
	 */
	strToXml:function(str){
		var DOMParser = kmj.DOMParser || new window.DOMParser;
		if (!kmj.DOMParser){
			kmj.DOMParser = DOMParser;
		}
		return DOMParser.parseFromString(str, "text/xml");
	},
	/**
	 * Method coverts XML to JSQN
	 * @id  xmlToJson
	 * @see kmj.xmltojson.js
	 *
	 */
	xmlToJson:null
}

kmj.init();