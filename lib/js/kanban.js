(function($, _, can, chrome, d3, less, window){
    "use strict";

    var backgroundPage = chrome.extension.getBackgroundPage(),
        kanban = {
            columnWidth:0,
            columnMon:{},
            dirty : backgroundPage.kmj.getLocalStore("TicketDirty", 0, 0),
            ticketHeight:backgroundPage.kmj.getLocalStore("TicketHeight", 0, function(val){return parseInt(val, 10); }),
            ticketWidth:backgroundPage.kmj.getLocalStore("TicketWidth", 0, function(val){return parseInt(val, 10); }),
            ticketOffsetTop:backgroundPage.kmj.getLocalStore("TicketOffsetTop", 0, function(val){return parseInt(val, 10) || 50; }),
            ticketKeepInViewport: backgroundPage.kmj.getLocalStore("TicketKeepInViewport",null,function(val){return val === 'true'}),
            ticketPriorityColours:JSON.parse(backgroundPage.kmj.getLocalStore("TicketPriorityColourMapping","{}")),
            ticketDefaultColour:backgroundPage.kmj.getLocalStore("TicketDefaultColour","#FFFEE2"),
            ticketThumbnailBaseFallback:backgroundPage.kmj.getLocalStore("TicketThumbnailBaseFallback",""),
            ticketThumbnailForceSize:backgroundPage.kmj.getLocalStore("TicketThumbnailForceSize",null,function(val){return val === 'true'}),
            ticketDirty:backgroundPage.kmj.getLocalStore('TicketDirty', 0, function(val){return parseInt(val, 10) || 0; }),
            list:[],
            kanbanTemplate:null,
            baseZIndex: 1000,
            checktimer:(60 * 1000),
            columnList:[],
            d3Selection:null,
            init:function(){
                if (!kanban.kanbanTemplate){
                    kanban.kanbanTemplate = backgroundPage.kmj.getLocalStore("KanbanTemplate");
                    can.$("#template").html( kanban.kanbanTemplate );
                }
                if (kanban.timer){
                    clearTimeout(kanban.timer);
                }
                kanban.timer = setTimeout(kanban.init, kanban.checktimer);
                if (!_.positionOf){
                    _.mixin({
                        positionOf : function(obj, key, value) {
                            var array = _.pluck(obj, key);
                            return (array.length>0) ? _.indexOf(array, value) : -1 ;
                        }
                    });
                }
                $('body').addClass('dirty_'+ kanban.ticketDirty );
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
                    var    template = can.view("#templateTitles", {columns: kanban.columnList });

                    kanban.columnWidth = ($("#divRadiator").width() / kanban.columnList.length);
                    can.$("#divInfo").append(template);
                } else if (kanban.columnList.length !== backgroundPage.kmj.getKanbanFilterList().length) {
                    kanban.columnList.replace( backgroundPage.kmj.getKanbanFilterList() );
                }
            },
            updateD3:function(d3items){
                kanban.d3Selection.call(kanban.d3display, d3items);
            },
            validateData:function(data){
                var mon = {},
                    exists = false,
                    key;
                for (var item in data){
                    if (data.hasOwnProperty(item)){
                        key = data[item].dataKey;
                        if (key) {
                            if (mon[key]){
                                mon[key].count++;
                                exists = true;
                            }else{
                                mon[key] = {key:key,count:1};
                            }
                        }
                    }
                }
                if (exists){
                    window.console.log( 'duplicates found '+ data.length );
                    window.console.log( mon );
                }
            },
            d3display:function(container, data){
                kanban.validateData(data);
                var element = container
                                .selectAll("article")
                                .data(data, function(d) { return d.dataKey; });
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
                    .style('background-position', kanban.getRandomBGPosition );

                // update existing
                element.html(function(d) { return d.html ; });
                element.transition()
                    .style('opacity','1')
                    .style("top", function(d){ return d.top ;} )
                    .style("left", function(d){ return d.left ;} )
                    .style('background-color', kanban.getPriorityStyle );

            },
            renderD3:function(d3items){
                kanban.d3Selection.call(kanban.d3display, d3items);
                kanban.postRender();
            },
            postRender:function(){
                $("article.ticket").each(function(i,el){
                    $(el).css('z-index', kanban.baseZIndex - i );
                });
                $("article.ticket img").each(function(i, el){
                    var assinee = getAssigneeName( $(el).attr("data-assignee") ),
                        src;

                    if (assinee !== "-1") {
                        src = backgroundPage.kmj.getLocalStore("TicketThumbnailBase") + assinee + backgroundPage.kmj.getLocalStore("TicketThumbnailType");
                    } else if (!!kanban.ticketThumbnailBaseFallback) {
                        src = kanban.ticketThumbnailBaseFallback;
                    }
                    $(el).on('error',function(e){
                        var el = this;
                        if ($(el).data('is-fallback') || !kanban.ticketThumbnailBaseFallback){
                            $(el).remove();
                        } else {
                            $(el)
                                .data('is-fallback', true)
                                .attr('src', kanban.ticketThumbnailBaseFallback);
                        }
                    });
                    if (kanban.ticketThumbnailForceSize){
                        $(el).addClass('fixedsize');
                    }
                    if (!!src){
                        $(el).attr('src', src);
                    } else {
                        $(el).remove();
                    }
                });
                less.modifyVars({
                    '@column-width': (100 / kanban.columnList.length) + '%',
                    '@column-header-colour': backgroundPage.kmj.getLocalStore("ColumnHeaderColour","#888888"),
                    '@ticket-height': kanban.ticketHeight + 'px',
                    '@ticket-width': kanban.ticketWidth + 'px',
                    '@ticket-thumbnail': backgroundPage.kmj.getLocalStore("TicketThumbnailSize")+"px",
                    '@base-color': backgroundPage.kmj.getLocalStore("BackgroundColor"),
                    '@base-bg-image': backgroundPage.kmj.getLocalStore("BackgroundImage"),
                    '@ticket-thumbnail-top': backgroundPage.kmj.getLocalStore("TicketThumbnailTop",0,function(val){return parseInt(val, 10) || 35; }) + "px"
                });
                function getAssigneeName(fullName){
                    var name,
                        re = backgroundPage.kmj.imageSrcReg || new RegExp( backgroundPage.kmj.getLocalStore("TicketThumbnailRegExp","(.*)")),
                        ticketThumbnailURLToLowerCase = backgroundPage.kmj.getLocalStore("TicketThumbnailURLToLowerCase",null,function(val){return val === 'true'});
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
                    if (ticketThumbnailURLToLowerCase && typeof( name ) === "string"){
                        name = name.toLowerCase();
                    }
                    return name;
                }
            },
            getItems:function(){
                kanban.columnMon = {};
                var items = [];
                $("#dataStore > *").each(function(index, ticket){
                    var item = itemRef(ticket, index);
                    items.push(item);
                });
                return items; // _.sortBy(items, function(item){return item.dataKmjColumnIndex ;});
                function itemRef(item, index){
                    var obj = {
                        dataKey:$(item).attr('data-key'),
                        dataFilterId:$(item).attr('data-filter-id'),
                        dataKmjColumnIndex:_.positionOf(kanban.columnList, 'id', $(item).attr('data-filter-id')),
                        dataKmjPriority:$(item).attr('data-priority'),
                        html:$(item).html(),
                        top:kanban.getTop( {dataFilterId:$(item).attr('data-filter-id'), key:$(item).attr('data-key')}),
                        left:kanban.getLeft( {dataFilterId:$(item).attr('data-filter-id'), dataKmjColumnIndex:$(item).attr('data-column-index'), key:$(item).attr('data-key')})
                    };
                    return obj;
                }
            },
            getPriorityStyle:function(d){
                var p = (d.dataKmjPriority) ? d.dataKmjPriority.toString() : "",
                    colour = kanban.ticketDefaultColour;
                if( kanban.ticketPriorityColours[p] ){
                    colour = kanban.ticketPriorityColours[p];
                }
                return colour ;
            },
            getRandomBGPosition:function(){
                var r = function(d){
                        if (kanban.dirty === 0){
                            return '-999';
                        }
                        return kanban.rand(-d, d) / kanban.dirty;
                    },
                    v = function(n){ return r(n) + 'px '+ r(n) +'px'; };
                return  v(1000) +', '+ v(1000) +', '+ v(1000) +', '+ v(500);
            },
            isInBottomRow:function(d){
                var index = 0,
                    top = 0,
                    h = document.documentElement.clientHeight,
                    isBottom = false,
                    t = (kanban.ticketHeight + kanban.ticketOffsetTop) ,
                    r = $("#divRadiator").offset().top;
                if (kanban.columnMon[d.dataFilterId]){
                    index = kanban.columnMon[d.dataFilterId].length;
                }
                top = ( t * index );
                if ( kanban.ticketKeepInViewport && top > (h/2)+t+r ) {// we are in the bottom half
                    isBottom = true;
                }
                return isBottom;
            },
            getIndex:function(d){
                var index = 0;
                if (kanban.columnMon[d.dataFilterId]){
                    index = kanban.columnMon[d.dataFilterId].length;
                }
                return index;
            },
            getZIndex:function(d){
                var index = kanban.getIndex(d);
                return 1000 - index;
            },
            getTop:function(d){
                // we need the position of this item in relation to the
                // other tickets in it's column
                var index = kanban.getIndex(d),
                    h = document.documentElement.clientHeight,
                    top = 0,
                    t = (kanban.ticketHeight + kanban.ticketOffsetTop);

                if (index === 0){
                    kanban.columnMon[d.dataFilterId] = new Array();
                }
                kanban.columnMon[d.dataFilterId].push(d.key);
                top = ( t * index );
                if ( kanban.isInBottomRow(d) ) {// we are in the bottom half
                    top = (h/4)*2 + t + kanban.rand(-kanban.ticketHeight,kanban.ticketHeight);
                }
                return  top + 'px';
            },
            getLeft:function(d){
                var index = parseInt(d.dataKmjColumnIndex,10) || 0,
                    x = ( kanban.columnWidth * index ) + (  kanban.columnWidth / 2 ),
                    isBottom = kanban.isInBottomRow(d),
                    w = kanban.columnWidth / 7;

                if ( kanban.isInBottomRow(d) ){
                    x= x + kanban.rand(-w, w)
                }
                return x+ 'px';
            },
            rand:function(min,max){
                max++;
                if (kanban.ticketDirty === 0){
                    return 0;
                }
                var r = Math.floor(Math.random()*(max-min)+min);
                if (r === 0){ r = (Math.floor(Math.random()*10) >=5 ) ? -1 : 1 ;}// don't allow 0
                return r;
            },
            randomate:function(){
                $("a.a-title-link").each(function(i,el){
                    var deg = kanban.rand(-3,3);
                    $(el).css({ '-webkit-transform': 'rotate(' + deg + 'deg)'});
                });
                $("article.ticket").each(function(i,el){
                    var deg = kanban.rand(-1,2);
                    $(el).css({ '-webkit-transform': 'rotate(' + deg + 'deg)'});
                });
                $("article.ticket img").each(function(i,el){
                    var deg = kanban.rand(-10,10);
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
        kanban.init();
        $(window).on('resize',function(){
            if ("resizetimer" in kanban){
                clearTimeout(kanban.resizetimer);
            }
            kanban.resizetimer = setTimeout(kanban.refreshDisplay, 1000);
        });
        window.backgroundPage = backgroundPage;
        window.kanban = kanban;
    });


})(window.$, window._, window.can, window.chrome, window.d3, window.less, window);
