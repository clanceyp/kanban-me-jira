(function($, _, can, chrome, d3, less, window){
	"use strict";

	var backgroundPage = chrome.extension.getBackgroundPage(),
		kanban = {
			columnWidth:0,
			columnIds:[],
			columnMon:{},
			ticketHeight:backgroundPage.kmj.getLocalStore("TicketHeight"),
			ticketPriorityColours:backgroundPage.kmj.getLocalStore("TicketPriorityColourMapping")||{},
			ticketDefaultColour:backgroundPage.kmj.getLocalStore("TicketDefaultColour","#FFFEE2"),
			items:[],
			columnList:[],
			init:function(){
				can.$("#template").html( backgroundPage.kmj.getLocalStore("KanbanTemplate") );
				kanban.drawColumnHeaders();
				kanban.drawColumnContents();
				kanban.initRandomiseLayout();
			},
			drawColumnContents:function(){
				var items = backgroundPage.kmj.kanbanItems,
					template;
				if (items && items.length) {
					kanban.list = new can.Observe.List( items );
					template = can.view("#template", {jira: kanban.list });
					can.$("#dataStore").append(template);
				}
				kanban.renderD3( kanban.getItems() );
			},
			drawColumnHeaders:function(){
				kanban.columnList = new can.Observe.List( backgroundPage.kmj.getKanbanFilterList() );
				kanban.columnIds = _.pluck(kanban.columnList, 'id');
				var	template = can.view("#templateTitles", {columns: kanban.columnList });

				kanban.columnWidth = ($("#divRadiator").width() / kanban.columnList.length);
				can.$("#divInfo").append(template);
				less.modifyVars({
					'@column-width': (100 / kanban.columnList) + '%'
				});
			},
			renderD3:function(d3items){
				d3.select("#divRadiator")
					.selectAll("div")
					.data( d3items )
					.enter()
					.append("div")
					.attr("class", "ticket" )
					.attr("data-id", function(d){ return d.dataKey; })
					.attr("data-filter-id", function(d){ return d.dataFilterId; })
					.attr("data-column-index", function(d){ return d.dataKmjColumnIndex; })
					.style("top", kanban.getTop )
					.style("left", kanban.getLeft )
					.style('backgroundColor', kanban.getPriorityStyle )
					.html(function(d) { return d.html ; });
				kanban.postRender();
			},
			postRender:function(){
				less.modifyVars({
					'@ticket-height': kanban.ticketHeight + 'px',
					'@ticket-thumbnail': backgroundPage.kmj.getLocalStore("TicketThumbnailSize")+"px"
				});
				$("div.ticket img").each(function(){
					var src = backgroundPage.kmj.getLocalStore("TicketThumbnailBase") + $(this).attr("data-assignee") + backgroundPage.kmj.getLocalStore("TicketThumbnailType");
					console.log(src);
					$(this).on('error',function(){$(this).remove();});
					$(this).attr('src', src);
				})
			},
			getItems:function(){
				var items = [];
				$("#dataStore > *").each(function(){
					var item = {
						dataKey:$(this).attr('data-key'),
						dataFilterId:$(this).attr('data-filter-id'),
						dataKmjColumnIndex:$(this).attr('data-column-index'),
						dataKmjPriority:$(this).attr('data-priority'),
						html:$(this).html()
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
				kanban.columnMon[d.dataFilterId].push(d);

				return ( (kanban.ticketHeight+60) * index) + 'px';
			},
			getLeft:function(d){
				var index = _.indexOf(kanban.columnIds, d.dataFilterId),
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
				$("div.ticket").each(function(i,el){
					var deg = rand(-1,2);
					$(el).css({ '-webkit-transform': 'rotate(' + deg + 'deg)'});
				});
				$("div.ticket img").each(function(i,el){
					var deg = rand(-10,10);
					if (i % 5 === 1){deg = 0;}
					$(el).css({ '-webkit-transform': 'rotate(' + deg + 'deg)'});
				});
			},
			initRandomiseLayout:function(){
				$("a.a-title-link, div.ticket, div.ticket img").each(function(i,el){
					$(el).css({ '-webkit-transition': 'all 500ms ease-out'});
				});
				kanban.randomate();
				$("body").on('dblclick',function(){
					if ($('body').hasClass("neat")) {
						kanban.randomate();
						$('body').removeClass("neat");
					} else {
						$("a.a-title-link, div.ticket, div.ticket img").each(function(i,el){
							$(el).css({ '-webkit-transform': 'rotate(0deg)'});
						});
						$('body').addClass("neat");
					}
					try {
						document.getSelection().removeAllRanges();
					}catch(e){}
				});
			}
		};

	$(window).on('load',function(){
		window.backgroundPage = backgroundPage;
		window.kanban = kanban;
		kanban.init();
		less.modifyVars({
			'@base-color': backgroundPage.kmj.getLocalStore("BackgroundColor"),
			'@base-bg-image': backgroundPage.kmj.getLocalStore("BackgroundImage")
		});
	});

})(window.$, window._, window.can, window.chrome, window.d3, window.less, window);
