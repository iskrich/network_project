var contacts = {};

function getContactList(){
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
	if(xmlhttp.readyState == 4){
	    var json = JSON.parse(xmlhttp.responseText);
	    if(json.status == 'fail')
		alert(json.error);
	    else {
		var contactlist = document.getElementById("incoming").getElementsByTagName('ul')[0];
		contactlist.innerHTML = '';
		json.incoming.forEach(function(user){
		    contactlist.innerHTML += "<li>" + requestButton('accept', user.name) + requestButton('reject', user.name) + user.name + "</li>";
		});

		var contactlist = document.getElementById("outgoing").getElementsByTagName('ul')[0];
		contactlist.innerHTML = '';
		json.outgoing.forEach(function(user){
		    contactlist.innerHTML += "<li>" + requestButton('cancel', user.name) + user.name + "</li>";
		});

		var contactlist = document.getElementById("contacts").getElementsByTagName('ul')[0];
		contactlist.innerHTML = '';
		if(json.contacts.length == 0)
		    contactlist.innerHTML = "<li>You don't have any contacts</li>";
		else json.contacts.forEach(function(user){
		    var item = document.createElement('li');
		    item.innerHTML = requestButton('remove', user.name) + user.name;
		    if(user.online) item.classList.add('online');
		    contactlist.appendChild(item);
		    contacts[user.name] = item;
		    item.onclick = function(){
			setConversation(user.conv);
		    };
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

function getTarget(){
    return document.getElementById("target").value;
}

function requestButton(action, target){
    return "<button onClick=\"sendRequest('" + action + "','" + target + "')\">" + action + "</button>";
}

function expand(sel){
    document.querySelector(sel).classList.toggle('collapsed');
}
