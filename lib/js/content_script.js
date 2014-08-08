(function(window, document, undefined){
    if (!window.kmjEventListenerAdded){
        document.addEventListener("keyup", function( e ){
            var code = e.keyCode || e.which || 0,
                re,
                href,
                arr,
                direction = 1;
            if (code < 37 || code > 40 || document.body !== document.activeElement){
                return;
            }
            re = new RegExp('(\\S*?-)(\\d+)(\\S*)','g'),
            href = location.href;
            arr = re.exec( href );
            if (!arr || arr.length < 2){// is it a valid URL
                return;
            }
            if (code === 37 || code === 40){// are we going up or down?
                direction = -1;
            }
            arr.shift();// remove the full URL
            for (var i = 0; i<arr.length; i++){
                if ( !isNaN( parseInt(arr[i], 10) ) ){ // increment the jira numer
                   arr[i] = parseInt(arr[i], 10) + direction;
                   break;
                }
            }
            location.href = arr.join('');
        }, false);
    }
    window.kmjEventListenerAdded = true;
})(window, document);
