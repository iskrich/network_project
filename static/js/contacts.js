function getContactList(){
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
	if(xmlhttp.readyState == 4){
	    var json = JSON.parse(xmlhttp.responseText);
	    if(json.status == 'fail')
		alert(json.error);
	    else {
		var contactlist = document.getElementById("incoming");
		contactlist.innerHTML = '';
		if(json.incoming.length == 0)
		    contactlist.innerHTML = "None";
		else json.incoming.forEach(function(user){
		    contactlist.innerHTML += "<li>" + requestButton('accept', user.name) +
			requestButton('reject', user.name) + user.name + "</li>";
		});

		var contactlist = document.getElementById("outgoing");
		contactlist.innerHTML = '';
		if(json.outgoing.length == 0)
		    contactlist.innerHTML = "None";
		else json.outgoing.forEach(function(user){
		    contactlist.innerHTML += "<li>" + requestButton('cancel', user.name) + user.name + "</li>";
		});

		var contactlist = document.getElementById("contacts");
		contactlist.innerHTML = '';
		if(json.contacts.length == 0)
		    contactlist.innerHTML = "You don't have any contacts";
		else json.contacts.forEach(function(user){
		    contactlist.innerHTML += "<li>" + requestButton('remove', user.name) + historyButton(user.conv) + sendButton(user.conv) + user.name + (user.online ? "(+)" : "(-)") + "</li>";
		});
	    }
	}
    }
    xmlhttp.open("GET", "contacts", true);
    xmlhttp.send();
}

function sendRequest(action, target){
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
	if(xmlhttp.readyState == 4){
	    var json = JSON.parse(xmlhttp.responseText);
	    if(json.status == 'fail')
		alert(json.error);
	    getContactList();
	}
    }
    xmlhttp.open("POST", "contacts", true);
    xmlhttp.send(JSON.stringify({
	'action':  action,
	'target': target
    }));
}

function getHistory(id){
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
	if(xmlhttp.readyState == 4){
	    alert(xmlhttp.responseText);
	}
    }
    xmlhttp.open("GET", "talk?id=" + id + "&content=messages", true);
    xmlhttp.send();
}

function sendMessage(id){
    var message = prompt("Type your message");
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
	if(xmlhttp.readyState == 4){
	    var json = JSON.parse(xmlhttp.responseText);
	    if(json.error) alert(json.error);
	}
    }
    xmlhttp.open("POST", "talk", true);
    xmlhttp.send(JSON.stringify({id: id, message: message}));
}

function getTarget(){
    return document.getElementById("target").value;
}

function requestButton(action, target){
    return "<button onClick=\"sendRequest('" + action + "','" + target + "')\">" + action + "</button>";
}

function historyButton(id){
    return "<button onClick=\"getHistory('" + id + "')\">history</button>";
}

function sendButton(id){
    return "<button onClick=\"sendMessage('" + id + "')\">send</button>";
}
