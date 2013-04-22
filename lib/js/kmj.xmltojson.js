/**
 * Method coverts XML to JSQN
 * @id  xmlToJson
 * @memberOf kmj
 * @param {object} xml The input xml
 * @param {boolean} preserveAttributes Weather or not you need to preserve xml attributes
 * @return {object} The json result
 *
 */
(function(window){
"use strict";
    window.kmj.xmlToJson = function(xml, preserveAttributes, undefined) {
        var obj = {};

        if (xml.nodeType === 3) { // TEXT_NODE
            return xml.nodeValue.trim();
        } else if (xml.childNodes.length === 0) {
            return '';
        }

        // recurs into children
        if (xml.hasChildNodes()) {
            for(var i = 0; i < xml.childNodes.length; i++) {
                var item = xml.childNodes.item(i);
                var nodeName = item.nodeName;
                if (nodeName.indexOf('@') > -1){
                    throw new Error("XML format not supported");
                }
                if (obj[nodeName] === undefined) {
                    if (preserveAttributes === true && item.attributes && item.attributes.length > 0){
                        for (var j = 0; j < item.attributes.length; j++) {
                            var attribute = item.attributes.item(j);
                            obj[nodeName+'@'+attribute.nodeName] = attribute.nodeValue;
                        }
                    }
                    if (nodeName === '#text' && !item.firstChild ){
                        /* ignore empty text nodes */
                    } else if (item.childNodes.length === 1 && item.firstChild.nodeName === '#text'){
                        obj[nodeName] = ( item.firstChild.nodeValue + '' ).trim() ;
                    } else if (item.childNodes.length > 0){
                        obj[nodeName] = window.kmj.xmlToJson(item, true);
                    } else {
                        obj[nodeName] = window.kmj.xmlToJson(item, true);
                    }
                } else if ( obj[nodeName] ) {
                    if ( obj[nodeName].push === undefined) {
                        var old = obj[nodeName];
                        obj[nodeName] = [];
                        obj[nodeName].push(old);
                    }
                    obj[nodeName].push( window.kmj.xmlToJson(item, true) );
                }
            }
        }
        return obj;
    };

})(window);