

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
	jobs:[],
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
		kmj.sendRequest();
		if (kmj.repeat){
			clearTimeout(kmj.repeat);
		}
        if (kmj.checksoon){
            clearTimeout(kmj.checksoon);
        }
		kmj.repeat = setTimeout(kmj.init,kmj.getLocalStore("RefreshTime") * 1000 * 60 )
	},
	getCleanUrl:function(path){
		var url = kmj.getLocalStore("JiraURL") +"/",
			urlArr = url.split("://");
		if (urlArr.length > 1){
			return urlArr[0]+"://"+urlArr[1].replace(/\/+/g,'/') + path;
		} else {
			return urlArr[0].replace(/\/+/g,'/') + path;
		}
	},
	updateBrowserActionStatus:function(status) {
		kmj.log("update status: "+ status)
		//chrome.browserAction.setIcon({path:'lib/i/note.png'});
		chrome.browserAction.setBadgeText({text:'?'});
	},
	updateBrowserActionStatusPie:function(){
			function pie(ctx, w, h, datalist, colourlist, padding)
			{
				var p = padding || 0,
					radius = (h / 2) - p,
					centerx = w / 2,
					centery = h / 2,
					total = 0,
					last = 0,
					offset = Math.PI / 2,
					total = datalist.reduce(function(a, b) {
						return a + b;
					}),
					len = datalist.length;
				/* pie */
				ctx.save();
				for(var x=0; x < len; x++){
					var item = datalist[x],
						arcsector = Math.PI * (2 * item / total);
					ctx.beginPath();
					ctx.fillStyle = colourlist[x];
					ctx.moveTo(centerx,centery);
					ctx.arc(centerx, centery, radius, last - offset, last +
						arcsector - offset, false);
					ctx.lineTo(centerx, centery);
					ctx.fill();
					ctx.closePath();
					last += arcsector;
				}
				ctx.restore();
				ctx.beginPath();
				ctx.arc(centerx, centery, radius, 0, Math.PI*2, true);
				ctx.closePath();
				ctx.strokeStyle = "rgba(0,0,0,0.5)";
				ctx.lineWidth   = 1;
				ctx.stroke();

			}
		/*
			function ellipse(centerX, centerY, radX, radY, fill){
				ctx.save();
				ctx.beginPath();
				for (var i = 0 * Math.PI; i < 2 * Math.PI; i += 0.01 ) {
					var xPos = centerX - (radY * Math.sin(i)) * Math.sin(0 * Math.PI) + (radX * Math.cos(i)) * Math.cos(0 * Math.PI);
					var yPos = centerY + (radX * Math.cos(i)) * Math.sin(0 * Math.PI) + (radY * Math.sin(i)) * Math.cos(0 * Math.PI);
					if (i == 0) {
						ctx.moveTo(xPos, yPos);
					} else {
						ctx.lineTo(xPos, yPos);
					}
				}
				ctx.strokeStyle = "#000000";
				ctx.lineWidth   = 2;
				ctx.stroke();
				ctx.fillStyle = fill;
				ctx.fill();
				ctx.closePath();
				ctx.restore();
			}
			*/
			function getCanvas(){
				var canvas;
				if (document.getElementsByTagName("canvas").length){
					canvas = document.getElementsByTagName("canvas")[0]
				} else {
					canvas = document.createElement("canvas");
					document.getElementsByTagName('body')[0].appendChild( canvas )
				}
				return canvas;
			}
			var canvas = getCanvas(),
				datalist= [0,0,0],
				colourlist = new Array('#ff0000', '#00ff00', '#aaaaaa'),
				ctx = canvas.getContext('2d');
			datalist[0] = kmj.jobs.filter(function(job){ return job.color === "red"}).length;
			datalist[1] = kmj.jobs.filter(function(job){ return job.color === "blue"}).length;
			datalist[2] = kmj.jobs.length - (datalist[0] + datalist[1]);

			pie(ctx, 19, 19, datalist, colourlist, 2);
			var radgrad = ctx.createRadialGradient(5,5,2,5,5,5);
			radgrad.addColorStop(0, '#A7D30C');
			radgrad.addColorStop(0.9, '#019F62');
			radgrad.addColorStop(1, 'rgba(1,159,98,0)');
			//ctx.fillStyle = radgrad;
			//ctx.fillRect(0,0,150,150);
			// ellipse(400/2,400-40,70,30,"#888888");

		var imageData = ctx.getImageData(0, 0, 19, 19);

		chrome.browserAction.setIcon({
			imageData: imageData
		});
	},
	sendRequest:function(){
		var auth = null;
		if (kmj.httpRequest) {// we only need one request at a time, so cancel current request.
			kmj.httpRequest.abort();
		}
		if (kmj.abortTimer){
			window.clearTimeout(kmj.abortTimer);
		}

		kmj.httpRequest = new XMLHttpRequest();
		kmj.abortTimer = window.setTimeout(kmj.httpRequest.abort, DEFAULT_VALUES["timeout"]);
		var auth = null,
			useAuth = kmj.getLocalStore("UseAuth");

		if (useAuth == "true"){
			auth = window.btoa((kmj.getLocalStore("username") || '') + ':' + (kmj.getLocalStore("password") || ''));
		}
		try {
			kmj.httpRequest.onreadystatechange = kmj.handleResponse;
			kmj.httpRequest.onerror = kmj.handleResponseError;
			kmj.httpRequest.open('GET', kmj.getCleanUrl('api/json') , true);
			if (useAuth == "true") {
				kmj.log('using Authorization')
				kmj.httpRequest.setRequestHeader('Authorization', 'Basic ' + auth);
			}
			kmj.httpRequest.send();
		} catch (e) {
			kmj.handleResponseError(e);
		}
	},
	handleResponseError:function(e){
		kmj.log(e);
		kmj.log("Something bad happened, maybe couldn't connect to JIRA?")
		kmj.jobs = [];
	},
	handleResponse:function(){
		var auth = null,
			useAuth = kmj.getLocalStore("UseAuth");

		if (kmj.httpRequest && kmj.httpRequest.status == 200 && kmj.httpRequest.responseText){
			kmj.log(kmj.httpRequest.status)
			var response = JSON.parse(kmj.httpRequest.responseText),
				topStatus = -1,
				tempArray;
			if (!response.jobs) {
                kmj.checksoon = setTimeout(function(){
                    kmj.init();
                },3000)
				return;
			}
            if (response.jobs.length === 0){
                kmj.checksoon = setTimeout(function(){
                    kmj.init();
                },3000)
                return;
            }
            kmj.jobs = [];
			if (kmj.getLocalStore("SortBy") !== 'status') {
                tempArray = _.sortBy(response.jobs,function(job){return job.name});
			}else{
                tempArray = _.sortBy(response.jobs,function(job){return STATUSES[job.color]});
			}
			if (kmj.getLocalStore("SortDirection") === 'true'){
                tempArray.reverse();
			}
			topStatus = STATUSES[ _.max(tempArray, function(job) { return STATUSES[job.color]; }).color ];
			kmj.updateBrowserActionStatus(topStatus);
			for (var i = 0; i< tempArray.length; i++){
				var j = i,
					job = tempArray[j],
                    url = job.url+'/api/json'
                kmj.jobs.push(job);
				(function(job,url){
                    $.getJSON(url, function(data){
                        job.details = data;
                        if (job.details && job.details.lastBuild){
                            (function(job,url){
                                $.getJSON(url, function(data){
                                    try {
                                        job.details.lastBuild.details = data;
                                    } catch (e){
                                        job.details.lastBuild.details =  {};
                                    }
                                    kmj.updateBrowserActionStatusPie();
                                })
                            })(job,job.details.lastBuild.url+'/api/json')
                            } else {
                                job.details = job.details || {};
                                job.details.lastBuild = {};
                                kmj.updateBrowserActionStatusPie();
                            }
                        });
                    })(job,url)
                }
			//kmj.updateBrowserActionStatus(topStatus);
		}
	},
	processStatus:function(topStatus){

	}
}

kmj.init();