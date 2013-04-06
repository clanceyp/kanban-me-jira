/**
 * @author patcla
 */
const DEBUG = true;
const STATUSES = {
    '': 0,
    'undefined': 0,
    'aborted': 0,
    'aborted_anime': 0,
    'disabled': 0,
    'disabled_anime': 0,
    'grey': 0,
    'grey_anime': 0,
    'blue': 1,
    'blue_anime': 1,
    'yellow': 2,
    'yellow_anime': 2,
    'red': 3,
    'red_anime': 3
}
const DEFAULT_VALUES = {
	"timeout": 200000 // 20 seconds
	,"JiraURL":"http:// my JIRA url"
	,"JiraAPI":"/sr/jira.issueviews:searchrequest-xml/"
	,"PopupTitle":"My tickets"
	,"PopupTemplate":"<div>\n  {{#jira}}\n  <details>\n\t<summary>{{title}}</summary>\n\t<div>{{description}}</div>\n  </details>\n  {{/jira}}\n</div>"
	,"RefreshTime":15
	,"ColumnCount":3
	,"BackgroundColor":"rgb(0,0,0)"
	,"BackgroundImage":"dark_wood"
	,"Background":"true"
}

