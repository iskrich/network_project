function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) != -1) return c.substring(name.length,c.length);
    }
    return "";
}


function getWSURI(){
    var loc = window.location, new_uri;
    var uri;
    if (loc.protocol === "https:") uri = "wss://";
    else uri = "ws://";
    uri += loc.host + '/';
    uri += getCookie('token');
    console.log(uri);
    return uri;
}

var ws = new WebSocket(getWSURI());

ws.onmessage = function(data){
    var json = JSON.parse(data.data);
    switch(json.action){
    case 'status_change':
		contacts[json.user].classList.toggle('online', json.status);break;
	case 'new_message':
		addMessage(json.msg);
    }
    console.log(json);
};
