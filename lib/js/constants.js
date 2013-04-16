/**
 * @author patcla
 */
const DEBUG = true,
	TEST = true, // not used for Jasmine testing, used for off line development
	TEST_USE_FILTERID = true;
const DEFAULT_VALUES = {
	"timeout": 200000 // 20 seconds
	,"JiraURL":"http:// my JIRA url"
	,"JiraAPI":"/sr/jira.issueviews:searchrequest-xml/"
	,"JiraFilterURL":"/secure/IssueNavigator.jspa?requestId="
	,"PopupTitle":"My tickets"
	,"PopupTemplate":'{{#jira}}\n  <details>\n\t<summary>{{title}}</summary>\n\t<div><a href="{{kmjUrl}}{{key}}">visit - {{key}}</a>; {{{description}}}</div>\n  </details>\n{{/jira}}'
	,"KanbanTemplate":'{{#jira}}' +
'\n<div data-key="{{key}}" data-filter-id="{{kmjFilterId}}" data-column-index="{{kmjColumnIndex}}" data-priority="{{priority@id}}">'+
'\n  <div class="left">{{summary}}</div>'+
'\n    <div class="right">'+
'\n      <h3><a href="{{kmjUrl}}{{key}}">{{key}}</a></h3>'+
'\n      <img data-assignee="{{assignee@username}}" />'+
'\n    </div>'+
'\n  </div>' +
'\n</div>' +
'\n{{/jira}}'
	,"TicketWidth":300
	,"TicketHeight":160
	,"TicketBaseURL":"/browse/"
	,"TicketThumbnailSize":100
	,"TicketThumbnailBase":"/jira/images/icons/"
	,"TicketThumbnailType":".png"
	,"TicketThumbnailRegExp":"(^.*)(@.*)"
	,"TicketPriorityColourMapping":'{"1":"#FACAC8","2":"#FFEEED","3":"#FFEDF8","4":"#FFFEE2","5":"#EDFDFF","6":"#EDFFF2","7":"EDF3FF"}'
	,"RefreshTime":15
	,"ColumnCount":3
	,"ColumnHeaderColour":"#050"
	,"BackgroundColor":"rgb(0,0,0)"
	,"BackgroundImage":"dark_wood"
	,"Background":"true"
	,"TESTVALUE":"ABC"
}

