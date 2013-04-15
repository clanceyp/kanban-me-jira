/**
 * @author patcla
 */

(function($, chrome, ko){
"use strict";

var backgroundPage = chrome.extension.getBackgroundPage(),
	hideAuth = (backgroundPage.kmj.getLocalStore("allowBasicAuthentication") == "true") ? false : true,
	options = {
		ops:{
			"input":[
				{"name":"JiraURL","label":"JIRA URL","type":"text"}
				,{"name":"JiraAPI","label":"JIRA filter xml","type":"text"}
				,{"name":"RefreshTime","label":"Refresh time","type":"text","html5":"range",  parent:'advanced',ops:{"min":5,"max":600,"step":5,"range-type":"s"}}
				,{"name":"Test","label":"test config","type":"button","className":"displayonly",value:"validate","hidden":hideAuth}
				,{"label":"Popup config","type":"title","tag":"h3", parent:'default'}
				,{"name":"PopupTitle","label":"Title","type":"text"}
				,{"name":"PopupFilterID","label":"JIRA filter ID (e.g. tickets assigned to you)","type":"text"}
				,{"label":"Popup config","type":"title","tag":"h3", parent:'advanced'}
				,{"name":"PopupTemplate","label":"Mustache template","type":"textarea",  parent:'advanced'}
				,{"label":"Kanban wall column config (filter, title)","type":"title","tag":"h3" }
				,{"label":"Kanban wall column config (filter, title)","type":"title","tag":"h3" ,  parent:'advanced'}
				,{"name":"ColumnInfo","label":"","type":"hidden"}
				,{"id":"ColumnInfoContainer","label":"","type":"title",tag:"div"}
				,{"name":"KanbanTemplate","label":"Mustache template","type":"textarea",  parent:'advanced'}
				,{"label":"Kanban wall display","type":"title","tag":"h3"}
				,{"label":"Kanban wall display","type":"title","tag":"h3",  parent:'advanced'}
				,{"name":"Background","label":"Use background image (Background images by subtlepatterns.com)","type":"checkbox"}
				,{"name":"BackgroundImage","label":"Background image","type":"select",options:{"none":" - no image","carbon_fibre":"carbon fibre","corkboard":"corkboard","dark_mosaic":"dark mosaic","moulin":"moulin","padded":"padded","simple_dashed":"simple dashed","squares":"squares","dark_wood":"wood, dark","wood_1":"wood, dark grey","purty_wood":"wood, purty","retina_wood":"wood, retina"}}
				,{"name":"BackgroundColor","label":"Background colour","type":"text","html5":"color"}
				,{"name":"TicketThumbnailBase","label":"Thumbnail location","type":"text"}
				,{"name":"TicketThumbnailSize","label":"Thumbnail max size","type":"text","html5":"range",ops:{"min":50,"max":200,"step":5,"range-type":"px"},  parent:'advanced'}
				,{"name":"TicketThumbnailType","label":"Thumbnail file type","type":"text"}
				,{"name":"TicketThumbnailRegExp","label":"Thumbnail RegExp","type":"text",  parent:'advanced'}
				,{"name":"TicketPriorityColourMapping","label":"Ticket priority to background colour mapping","type":"text",  parent:'advanced'}
			]
		},
		init:function(){
			var manifest = chrome.runtime.getManifest();
			$("h1").html(manifest.name + " <span>"+ manifest.version +"</span>");
			$("#appVersion").text(manifest.version);
			$("#appName").text(manifest.name);
			options.setupForm();
			options.columnInfoViewModelInit();
		},
		getItemValue:function(key){
			return backgroundPage.kmj.getLocalStore(key);
		},
		saveItemValue:function(target){
			if (!target){return true;}
			var id = $(target).attr("id"),
				value = $(target).attr('value'),
				type = $(target).attr('type');
			if (type === "checkbox"){
				backgroundPage.kmj.setLocalStore(id, $(target).prop('checked') );
			} else {
				backgroundPage.kmj.setLocalStore(id,value);
			}
		},
		handleValueChange:function(e){
			var target = e.target;
			options.saveItemValue(target);
		},
		handleKeyup:function(e){
			var target = e.target;
			options.saveItemValue(target);
		},
		handleClick:function(e){
			var target = e.target;
			if (!target){return true;}
			if ($(target).attr('type') === 'reset'){
				e.preventDefault();
				options.resetForm();
			} else if ($(target).attr('type') == 'checkbox'){
				options.saveItemValue(target);
			}
		},
		resetForm:function(){
			backgroundPage.kmj.resetLocalStore();
			$('form fieldset').empty();
			options.setupForm();
		},
		setupForm:function(){
			for (var i = 0; i<options.ops.input.length; i++){
				var item = options.ops.input[i],
					hidden = (item.hidden) ? "hidden" : "",
					type = item.html5 || item.type || "text",
					opsStr = opsToString(item.ops),
					value = options.getItemValue(item.name) || item.value || "",
					parent;
				parent = (item.parent) ? $('form fieldset.'+ item.parent) : $('form fieldset.default');
				if (item.type === "button"){
						$(parent)
							.append('<p class="'+hidden+'"><label for="'+item.name+'">'+ item.label +'</label><input class="'+ item.className+'" '+ opsStr +' type="'+ type +'" id="'+ item.name +'" value="'+ value +'" /></p>');
				} if (item.type === "checkbox"){
					var checked = value === "true" || value === true ? true : false;
					$(parent)
						.append('<p class="option '+hidden+'"><span class="option"><input type="checkbox" id="'+ item.name +'" value="'+ options.getItemValue(item.name) +'" /></span><label for="'+item.name+'">'+ item.label +'</label></p>');
					$("#"+ item.name).prop('checked', checked );
				} else if (item.type === "text" || item.type === "password"){
					if (type === "range"){
						var t = item.ops["range-type"] || "";
						$(parent)
							.append('<p class="'+hidden+'"><label for="'+item.name+'">'+ item.label +' <span id="span'+item.name+'">'+value+'</span>'+t+'</label><input '+ opsStr +' type="'+ type +'" id="'+ item.name +'" /></p>');
						$('#'+ item.name).val( value );
						addRangeListener(item.name);
					} else {
						$(parent)
							.append('<p class="'+hidden+'"><label for="'+item.name+'">'+ item.label +'</label><input '+ opsStr +' type="'+ type +'" id="'+ item.name +'" /></p>');
						$('#'+ item.name).val( value );
					}
				} else if (item.type === "title"){
					var tag = item.tag || "h2",
						className = item.className ? ' class="'+ item.className +'"' : "",
						id = item.id ? ' id="'+ item.id +'"' : "";
					$(parent)
						.append("<"+tag + className + id +">"+ item.label +"</"+tag+">");
				} else if (item.type === "select"){
					var html = (function(options,value,html){
						for (var name in options){
							if (options[name] === value){
								html += '<option value="'+ name +'" selected="selected">'+ options[name] +'</option>';
							} else {
								html += '<option value="'+ name +'">'+ options[name] +'</option>';
							}
						}
						return html;
					})(item.options, value, '');
					$(parent)
						.append('<p class="'+hidden+'"><label for="'+item.name+'">'+ item.label +'</label><select '+ opsStr +' type="'+ type +'" id="'+ item.name +'">'+html+'</select></p>');
				} else if (item.type === "textarea"){
					$(parent)
						.append('<p class="'+hidden+'"><label for="'+item.name+'">'+ item.label +'</label><textarea '+ opsStr +' id="'+ item.name +'">'+value+'</textarea></p>');
				}
			}
			function opsToString(ops){
				if (!ops){return ""};
				var str = "";
				for (var name in ops){
					str+= name +'="'+ ops[name] +'"';
				}
				return str;
			}
			function addRangeListener(itmeName){
				$('#'+itmeName).on('change',function(){
					$('#span'+itmeName).text( $("#"+itmeName).val() );
				});
			}
		},
		/**
		 * Method, shows the correct section depending on which tab was clicked
		 * @id navigate
		 * @return void
		 */
		navigate:function(e){
			$("section").addClass("hidden");
			$("nav li.selected").removeClass('selected');
			$(e.target.hash).removeClass("hidden");
			$(e.target).parent("li").addClass("selected");
			e.preventDefault();
		},
		columnInfoViewModelInit:function(){
			$("#ColumnInfoContainer").html('<tbody data-bind="foreach: jiraFilters"><tr><td><input class="displayonly filterId" data-bind="value: id" /></td><td><input class="displayonly filterTitle" data-bind="value: title" /></td><td><img class="displayonly" data-bind="click: $root.removeFilter"  src="lib/i/trash.png"/></td></tr></tbody><tfoot><tr><td></td><td><img class="displayonly" data-bind="click: save" src="lib/i/ok.png"/></td><td><button class="displayonly" data-bind="click: addFilter, enable: jiraFilters().length < 12">Add column</button></td></tr></tfoot></table>');
			ko.applyBindings(new options.ColumnInfoViewModel());
		},
		ColumnInfoViewModel:function(){
			var self = this,
				rawData = backgroundPage.kmj.getLocalStore("ColumnInfo",'[{"id":"XX","title":"Title"}]'),
				data = JSON.parse(rawData),
				mappedTasks = $.map(data, function(item) { return new JiraFilter(item.id,item.title) ;});

			self.jiraFilters = ko.observableArray(mappedTasks);

			// Editable data
			self.jiraFilters();

			self.jiraFilters.subscribe(function( ) {
				//backgroundPage.kmj.setLocalStore("ColumnInfo", ko.toJSON(self.jiraFilters) );
			});

			// Operations
			self.addFilter = function() {
				self.jiraFilters.push(new JiraFilter('',''));
			};
			self.save = function(){
				backgroundPage.kmj.setLocalStore("ColumnInfo", ko.toJSON(self.jiraFilters) );
			};
			self.removeFilter = function(item) {
				self.jiraFilters.remove(item) ;
			};
			self.jiraFilters.subscribe(function( ) {
				self.save();
			});


			function JiraFilter(id, title){
				this.id = ko.observable(id);
				this.title = ko.observable(title);
				this.id.subscribe(function(){self.save();});
				this.title.subscribe(function(){self.save();});
			}

		}
	};


$(document).ready(function(){
	var section = "#sectionDonate";
	if(backgroundPage.kmj.getLocalStore("ge98AA68e8njj9","") === "8977XX-PZ34"){
		section = "#sectionSettings";
	}
	$(document).on('click', "input:not(.displayonly), button:not(.displayonly)", options.handleClick);
	$(document).on('keyup', "input:not(.displayonly), textarea:not(.displayonly)", options.handleKeyup);
	$(document).on('change', "select, input:not(.displayonly)", options.handleValueChange);
	options.init();
	$("nav a").each(function(i,el){
		if ($(this).attr("href") === section){
			$(this).parent("li").addClass("selected");
			return false;
		}
	});
	$('nav a').on('click',options.navigate);
	$('form').on('change','#ColumnCount',function(event){
		var value = $(event.target).val(),
			str = backgroundPage.kmj.getLocalStore("JiraFilterIDs") || "{}";/*,
			ids = JSON.parse(str);*/
		$("#ColumnIDs").empty();
		for (var i = 0; i < value; i++){
			$("#ColumnIDs").append('<p><input type="text" /></p>');
		}
		// $("h1").text( value );
	});
	$("#formDonate").on("submit",function(){
		backgroundPage.kmj.setLocalStore("ge98AA68e8njj9","8977XX-PZ34");
	});
	$(section).removeClass("hidden");

});


})(window.$, window.chrome, window.ko);


