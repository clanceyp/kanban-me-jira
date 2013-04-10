/**
 * @author patcla
 */
const DEBUG = true,
	TEST = true;
const DEFAULT_VALUES = {
	"timeout": 200000 // 20 seconds
	,"JiraURL":"http:// my JIRA url"
	,"JiraAPI":"/sr/jira.issueviews:searchrequest-xml/"
	,"PopupTitle":"My tickets"
	,"PopupTemplate":"{{#jira}}\n  <details>\n\t<summary>{{title}}</summary>\n\t<div>{{{description}}}</div>\n  </details>\n{{/jira}}"
	,"KanbanTemplate":'{{#jira}}\n  <div data-key="{{key}}" data-filter-id="{{kmjFilterId}}">{{title}}</div>\n{{/jira}}'
	,"TicketWidth":300
	,"TicketHeight":160
	,"TicketThumbnail":100
	,"RefreshTime":15
	,"ColumnCount":3
	,"BackgroundColor":"rgb(0,0,0)"
	,"BackgroundImage":"dark_wood"
	,"Background":"true"
}

