/**
 * @author patcla
 */
const DEBUG = true,
	TEST = false;
const DEFAULT_VALUES = {
	"timeout": 200000 // 20 seconds
	,"JiraURL":"http:// my JIRA url"
	,"JiraAPI":"/sr/jira.issueviews:searchrequest-xml/"
	,"PopupTitle":"My tickets"
	,"PopupTemplate":"{{#jira}}'\n  <details>\n\t<summary>{{title}}</summary>\n\t<div>{{{description}}}</div>\n  </details>\n{{/jira}}"
	,"KanbanTemplate":'{{#jira}}' +
'\n<div data-key="{{key}}" data-filter-id="{{kmjFilterId}}" data-column-index="{{kmjColumnIndex}}" data-priority="{{priority}}">'+
'\n  <div class="left">{{summary}}</div>'+
'\n    <div class="right">'+
'\n      <h3>{{key}}</h3>'+
'\n      <img data-assignee="{{assignee@username}}" />'+
'\n    </div>'+
'\n  </div>' +
'\n</div>' +
'\n{{/jira}}'
	,"TicketWidth":300
	,"TicketHeight":160
	,"TicketThumbnailSize":100
	,"TicketThumbnailBase":"/jira/images/icons/"
	,"TicketThumbnailType":".png"
	,"TicketPriorityColourMapping":{"1":"#FF7575","2":"#FFACEC","3":"#CBC5F5","4":"#B5FFC8","5":"#FFFFB5","6":"#D2FFC4"}
	,"RefreshTime":15
	,"ColumnCount":3
	,"BackgroundColor":"rgb(0,0,0)"
	,"BackgroundImage":"dark_wood"
	,"Background":"true"
}

