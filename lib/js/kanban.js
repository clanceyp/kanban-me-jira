(function($, can, chrome, d3, less){
	"use strict";

	window.backgroundPage = chrome.extension.getBackgroundPage();
	var kanban = {
		init:function(){
			can.$("#template").html( backgroundPage.kmj.getLocalStore("KanbanTemplate") );
			kanban.drawColumnHeaders();
			kanban.drawColumnContents();
		},
		drawColumnContents:function(){
			var items = backgroundPage.kmj.kanbanItems;
			if (items && items.length) {
				var list = new can.Observe.List( items ),
					template = can.view("#template", {jira: list });

				can.$("#divRadiator").append(template);
			}
			kanban.renderD3( kanban.getItems() );
		},
		drawColumnHeaders:function(){
			var items = backgroundPage.kmj.getKanbanFilterList(),
				list = new can.Observe.List( items ),
				template = can.view("#templateTitles", {columns: list });

			can.$("#divInfo").append(template);
		},
		renderD3:function(d3items){
			d3.select("#divRadiator")
				.selectAll("div")
				.data( d3items )
				.enter()
				.append("div")
				.attr("class", "ticket")
				.attr("data-id", function(d){ return d.dataKey; })
				.attr("data-filter-id", function(d){ return d.dataFilterId; })
				.style("position","absolute")
				.style("top", kanban.getTop )
				.style("left", kanban.getLeft )
				.html(function(d) { return d.html ; });
		},
		getItems:function(){
			var items = [];
			$("#divRadiator > *").each(function(){
				var item = {
					dataKey:$(this).attr('data-key'),
					dataFilterId:$(this).attr('data-filter-id'),
					html:$(this).html()
				};
				items.push(item);
			});
			$("#divRadiator").empty();
			return items;
		},
		getTop:function(item){
			// top is the
			return 300;
		},
		getLeft:function(item){
			return "200px";
		}
	};

	$(document).ready(function(){
		less.modifyVars({
			'@base-color': backgroundPage.kmj.getLocalStore("BackgroundColor"),
			'@base-bg-image': backgroundPage.kmj.getLocalStore("BackgroundImage")
		});
		kanban.init();
	});

})(window.$, window.can, window.chrome, window.d3, window.less);
