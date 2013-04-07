var backgroundPage = chrome.extension.getBackgroundPage();
var kanban = {
	items:backgroundPage.kmj.items,
	init:function(){

		can.$("#template").html( backgroundPage.kmj.getLocalStore("KanbanTemplate") );
		if (kanban.items && kanban.items.length) {
			var list = new can.Observe.List( kanban.items ),
				template = can.view("#template", {jira: list });

			can.$("#divRadiator").append(template);
		}
		d3.select("#divRadiator")
			.selectAll("div")
			.data( kanban.getItems() )
			.enter()
			.append("div")
			.attr("class", "ticket")
			.text(function(d) { return d.html; });
	},
	getItems:function(){
		var items = []
		$("#divRadiator > *").each(function(){
			var item = {
				key:$(this).attr('data-key')
				,html:$(this).html()
			}
			items.push(item)
		})
		return items;
	}
}

$(document).ready(function(){
	kanban.init();
});