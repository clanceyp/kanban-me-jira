(function(window, document, undefined){
    if (!window.kmjEventListenerAdded){// don't add multiple times
        window.kmjEventListenerAdded = true;
        document.addEventListener("keyup", function( e ){// arrow keys fire keyup event
            var code = e.keyCode || e.which || 0,
                re,
                key = {
                    LEFT:37,
                    DOWN:40
                },
                href,
                arr,
                direction = 1;
            if (code < key.LEFT || code > key.DOWN || document.body !== document.activeElement){
                return;
            }
            re = new RegExp('(\\S*?-)(\\d+)(\\S*)','g'),
            href = location.href;
            arr = re.exec( href );
            if (!arr || arr.length < 2){// is it a valid URL
                return;
            }
            if (code === key.LEFT || code === key.DOWN){// are we going up or down?
                direction = -1;
            }
            arr.shift();// remove the full URL
            for (var i = 0; i<arr.length; i++){
                if ( !isNaN( parseInt(arr[i], 10) ) ){ // increment the jira number
                   arr[i] = parseInt(arr[i], 10) + direction;
                   break;
                }
            }
            location.href = arr.join('');
        }, false);
    }
})(window, document);
