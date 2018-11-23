/**
 * @author patcla
 */
var DEBUG = false,
	TEST = false, // not used for Jasmine testing, used for off line development
	TEST_USE_FILTERID = false;
var DEFAULT_VALUES = {
	"timeout": 200000 // 20 seconds
	,"JiraURL":"http:// my JIRA url /jira/"
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
    ,"TicketDirty":1
	,"TicketWidth":300
	,"TicketHeight":160
	,"TicketOffsetTop":50
	,"TicketThumbnailTop":35
	,"TicketBaseURL":"/browse/"
	,"TicketThumbnailURLToLowerCase":"false"
	,"TicketThumbnailSize":100
	,"TicketThumbnailBase":"http:// full path to images folder"
	,"TicketThumbnailBaseFallback":""
	,"TicketThumbnailForceSize":"false"
	,"TicketKeepInViewport":"true"
	,"TicketThumbnailType":"#"
	,"TicketThumbnailRegExp":"(^.*)(@.*)"
	,"TicketPriorityColourMapping":'{"1":"#FACAC8","2":"#FFEEED","3":"#FFEDF8","4":"#FFFEE2","5":"#EDFDFF","6":"#EDFFF2","7":"EDF3FF"}'
	,"RefreshTime":300
	,"ColumnCount":3
	,"ColumnHeaderColour":"#050"
	,"BackgroundColor":"rgb(136,136,136)"
	,"BackgroundImage":"dark_wood"
	,"Background":"true"
	,"AvatarUseJIRAProfile": "false"
	,"JIRAProfileJSONurl": ""
	,"AvatarJIRADefault": ""
	,"TESTVALUE":"ABC"
	,"keyNavigation":"true"
};
var HELP = {
	"timeout": 'Length of time to wait before assuming the connection has failed'
	,"JiraURL":'Your JIRA URL e.g. http://my.domain.com/jira/'
	,"JiraAPI":'Relative path to filter XML e.g. /sr/jira.issueviews:searchrequest-xml/'
	,"JiraFilterURL":'Relative path to JIRA filter e.g. /secure/IssueNavigator.jspa?requestId='
	,"PopupFilterID":'To find the id of a JIRA filter, login to JIRA go to the filter and copy the id from the query-string, typically a five digit number'
	,"PopupTitle":'Title of the filter to show in the extension popup'
	,"PopupTemplate":'HTML template used for each ticket by the extension popup (mustache format)'
	,"KanbanTemplate":'HTML template used for each ticket by the extension kanban page (mustache format)'
    ,"TicketDirty":'How dirty the tickets should be, set 0 for clean'
	,"TicketWidth":'Kanban page ticket width'
	,"TicketHeight":'Kanban page ticket height'
	,"TicketOffsetTop":'The gap between the tickets in px'
	,"TicketBaseURL":'JIRA ticket URL'
	,"TicketThumbnailURLToLowerCase": 'Force avartar URL to lower case'
	,"TicketThumbnailSize":'Max size of the assingee image (if used)'
	,"TicketThumbnailForceSize":'Force images to the max size (square)'
	,"TicketThumbnailTop":'Distance the thumbnail avatars are displayed from the top of the ticket'
	,"TicketKeepInViewport":"Keep tickets in viewport, allow tickets to pile on top of each other instead of dropping below the fold" 
	,"TicketThumbnailBase":'Fully qualified URL where the assignee images are located, e.g. http://my.domain.com/jira/secure/useravatar?size=$thum.type&ownerId=$user.name'
	,"TicketThumbnailBaseFallback" : 'Fallback image if no user image is found, leave blank for none'
	,"TicketThumbnailRegExp":'If present will pass the assignee value provided and returns the first submatch, for example given "bill@ben.com" the re (^.*)(@.*) will return "bill"'
	,"TicketPriorityColourMapping":'Hashmap which maps priority to background colour in the format {"[priority-key]":"[colour-value]"}'
	,"RefreshTime":'Frequency to check server for changes (in seconds)'
	,"ColumnCount":''
	,"ColumnHeaderColour":'Font colour of headers on the kanban page'
    ,"ColumnTitle":'To configure the kanban wall add columns in the format filter-id - title. <br/>After making changes to this section press the tick to save'
    ,"BackgroundColor":'Background colour of the kanban page (only visible if you set the background image to none)'
    ,"BackgroundImage":'Background image used on the kanban page (set to "- no image" to use a flat colour)'
    ,"Background":''
	,"keyNavigation":'Allow right, left (and up, down) keys to trigger navigation to the next, previous ticket'
	,"AvatarUseJIRAProfile": 'When set to true the extension will try to find the user avatar from the users profile page'
	,"JIRAProfileJSONurl": 'If trying to get the avatar from Jira Profile, add the rest url e.g. /jira/rest/api/2/user?username='
	,"AvatarJIRADefault": 'If using JIRA avatars, full url to default avatar e.g. https://my.domain.com/jira/secure/useravatar?avatarId=1'
}
