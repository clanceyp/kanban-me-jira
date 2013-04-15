(function($, _, can, chrome, d3, less, window){
	"use strict";

	var backgroundPage = chrome.extension.getBackgroundPage(),
		kanban = {
			columnWidth:0,
			columnMon:{},
			ticketHeight:backgroundPage.kmj.getLocalStore("TicketHeight"),
			ticketOffsetTop:50,
			ticketPriorityColours:JSON.parse(backgroundPage.kmj.getLocalStore("TicketPriorityColourMapping","{}")),
			ticketDefaultColour:backgroundPage.kmj.getLocalStore("TicketDefaultColour","#FFFEE2"),
			items:[],
			list:[],
			columnList:[],
			d3Selection:null,
			init:function(){
				can.$("#template").html( backgroundPage.kmj.getLocalStore("KanbanTemplate") );
				kanban.drawColumnHeaders();
				kanban.drawColumnContents();
				kanban.initRandomiseLayout();
			},
			drawColumnContents:function(){
				var items = backgroundPage.kmj.kanbanItems,
					template;
				if (items && items.length && kanban.list.length === 0) {
					kanban.list = new can.Observe.List( items );
					template = can.view("#template", {jira: kanban.list });
					can.$("#dataStore").append(template);
				} else if (items && items.length) {
					kanban.list.replace( items );
				}
				kanban.d3Selection = kanban.d3Selection || d3.select("#divRadiator");
				kanban.renderD3( kanban.getItems() );
			},
			drawColumnHeaders:function(){
				if (kanban.columnList.length === 0){
					kanban.columnList = new can.Observe.List( backgroundPage.kmj.getKanbanFilterList() );
					var	template = can.view("#templateTitles", {columns: kanban.columnList });

					kanban.columnWidth = ($("#divRadiator").width() / kanban.columnList.length);
					can.$("#divInfo").append(template);
				} else {
					kanban.columnList.replace( backgroundPage.kmj.getKanbanFilterList() );
				}
			},
			updateD3:function(d3items){
				kanban.d3Selection.call(kanban.d3display, d3items)
			},
			d3display:function(container, data){

				var element = container
								.selectAll("article")
								.data(data);
				// remove orphans
				element.exit().remove();
				// add new
				element.enter()
					.append("article")
					.attr("class", "ticket" )
					.attr("data-id", function(d){ return d.dataKey; })
					.attr("data-filter-id", function(d){ return d.dataFilterId; })
					.attr("data-column-index", function(d){ return d.dataKmjColumnIndex; })
					.attr("data-priority", function(d){ return d.dataKmjPriority; })
					.html(function(d) { return d.html ; })
				// update existing
				element.transition()
					.style("top", function(d){ return d.top } )
					.style("left", function(d){ return d.left } )
					.style('background-color', kanban.getPriorityStyle )

			},
			renderD3:function(d3items){
				/*kanban.d3Selection = d3.select("#divRadiator")
					.selectAll("article")
					.data( d3items )
					.enter()
					.append("article")
					.attr("class", "ticket" )
					.attr("data-id", function(d){ return d.dataKey; })
					.attr("data-filter-id", function(d){ return d.dataFilterId; })
					.attr("data-column-index", function(d){ return d.dataKmjColumnIndex; })
					.attr("data-priority", function(d){ return d.dataKmjPriority; })
					.html(function(d) { return d.html ; })
					.style("top", kanban.getTop )
					.style("left", kanban.getLeft )
					.style('background-color', kanban.getPriorityStyle )*/

				kanban.d3Selection.call(kanban.d3display, d3items)
				kanban.postRender();
			},
			postRender:function(){
				$("article.ticket img").each(function(){
					var assinee = getAssigneeName( $(this).attr("data-assignee") ),
						src = backgroundPage.kmj.getLocalStore("TicketThumbnailBase") + assinee + backgroundPage.kmj.getLocalStore("TicketThumbnailType");
					// console.log("src: " +src);
					$(this).on('error',function(){$(this).remove();});
					$(this).attr('src', src);
				})
				less.modifyVars({
					'@column-width': (100 / kanban.columnList.length) + '%',
					'@column-header-colour': backgroundPage.kmj.getLocalStore("ColumnHeaderColour","#888888"),
					'@ticket-height': kanban.ticketHeight + 'px',
					'@ticket-thumbnail': backgroundPage.kmj.getLocalStore("TicketThumbnailSize")+"px",
					'@base-color': backgroundPage.kmj.getLocalStore("BackgroundColor"),
					'@base-bg-image': backgroundPage.kmj.getLocalStore("BackgroundImage")
				});
				function getAssigneeName(fullName){
					var name,
						re = backgroundPage.kmj.imageSrcReg || new RegExp( backgroundPage.kmj.getLocalStore("TicketThumbnailRegExp","(.*)"));
					if (!backgroundPage.kmj.imageSrcReg){
						backgroundPage.kmj.imageSrcReg = re;
					}
					if (re){
						try {
							var temp = re.exec( fullName );
							if (temp && Array.isArray( temp )){
								name = temp.shift();
							}else{
								name = fullName;
							}
						} catch(e){
							name = fullName;
						}
					} else {
						name = fullName;
					}
					return name;
				}
			},
			getItems:function(){
				kanban.columnMon = {};
				var items = [];
				$("#dataStore > *").each(function(){
					var item = {
						dataKey:$(this).attr('data-key'),
						dataFilterId:$(this).attr('data-filter-id'),
						dataKmjColumnIndex:$(this).attr('data-column-index'),
						dataKmjPriority:$(this).attr('data-priority'),
						html:$(this).html(),
						top:kanban.getTop( {dataFilterId:$(this).attr('data-filter-id'), key:$(this).attr('data-key')}),
						left:kanban.getLeft( {dataKmjColumnIndex:$(this).attr('data-column-index'), key:$(this).attr('data-key')})
					};
					items.push(item);
				});
				return items;
			},
			getPriorityStyle:function(d){
				var p = (d.dataKmjPriority) ? d.dataKmjPriority.toString() : "",
					colour = kanban.ticketDefaultColour;
				if( kanban.ticketPriorityColours[p] ){
					colour = kanban.ticketPriorityColours[p];
				}
				//console.log( colour +": "+ d.dataKmjPriority)
				return colour ;
			},
			getTop:function(d){
				// we need the position of this item in relation to the
				// other tickes in it's column
				var index = 0;
				if (kanban.columnMon[d.dataFilterId]){
					index = kanban.columnMon[d.dataFilterId].length;
				} else {
					kanban.columnMon[d.dataFilterId] = new Array();
				}
				kanban.columnMon[d.dataFilterId].push(d.key);

				return ( (kanban.ticketHeight + kanban.ticketOffsetTop) * index) + 'px';
			},
			getLeft:function(d){
				var index = parseInt(d.dataKmjColumnIndex,10),
					w = ( kanban.columnWidth * index ) + (  kanban.columnWidth / 2 ) +"px";
				return w ;
			},
			randomate:function(){
				function rand(min,max){
					max++;
					var r = Math.floor(Math.random()*(max-min)+min);
					if (r === 0){ r = (Math.floor(Math.random()*10) >=5 ) ? -1 : 1 ;}// don't allow 0
					return r;
				}
				$("a.a-title-link").each(function(i,el){
					var deg = rand(-3,3);
					$(el).css({ '-webkit-transform': 'rotate(' + deg + 'deg)'});
				});
				$("article.ticket").each(function(i,el){
					var deg = rand(-1,2);
					$(el).css({ '-webkit-transform': 'rotate(' + deg + 'deg)'});
				});
				$("article.ticket img").each(function(i,el){
					var deg = rand(-10,10);
					if (i % 5 === 1){deg = 0;}
					$(el).css({ '-webkit-transform': 'rotate(' + deg + 'deg)'});
				});
			},
			initRandomiseLayout:function(){
				$("a.a-title-link, article.ticket, article.ticket img").each(function(i,el){
					$(el).css({ '-webkit-transition': 'all 500ms ease-out'});
				});
				kanban.randomate();
				$("body").on('dblclick',function(){
					if ($('body').hasClass("neat")) {
						kanban.randomate();
						$('body').removeClass("neat");
					} else {
						$("a.a-title-link, article.ticket, article.ticket img").each(function(i,el){
							$(el).css({ '-webkit-transform': 'rotate(0deg)'});
						});
						$('body').addClass("neat");
					}
					try {
						document.getSelection().removeAllRanges();
					}catch(e){}
				});
			},
			refreshDisplay:function(){
				kanban.columnWidth = ($("#divRadiator").width() / kanban.columnList.length);
				kanban.updateD3( kanban.getItems() );
				kanban.postRender();
			}
		};

	$(window).on('load',function(){
		window.backgroundPage = backgroundPage;
		window.kanban = kanban;
		kanban.init();
		$(window).on('resize',function(){
			if (kanban.resizeTimer){
				clearTimeout(kanban.resizeTimer)
			}
			kanban.resizeTimer = setTimeout(kanban.refreshDisplay, 500);
		})
		kanban.checkForUpdatesTimer = setInterval(function(){kmj.init();}, backgroundPage.kmj.getRefresh() );
	});

})(window.$, window._, window.can, window.chrome, window.d3, window.less, window);
