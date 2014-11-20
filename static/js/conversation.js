var current_conversation;

function getHistory(){
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
	if(xmlhttp.readyState == 4){
		document.getElementById("messagelog").innerHTML="";
		var json = JSON.parse(xmlhttp.responseText);
		for (var i=json.messages.length-1;i>=0;i--)
			addMessage(json.messages[i]);
	}
    }
    xmlhttp.open("GET", "talk?id=" + current_conversation + "&content=messages", true);
    xmlhttp.send();
}

function getParticipants(){
    var xmlhttp = new XMLHttpRequest();
	
    xmlhttp.onreadystatechange = function(){
	if(xmlhttp.readyState == 4){
		var json= JSON.parse(xmlhttp.responseText);
		document.getElementById("participants").innerHTML="";
		json.users.forEach(function(user){
	    document.getElementById("participants").innerHTML+=
		"<strong>"+user+"</strong>"+"</br>";

		});
	}
    }
    xmlhttp.open("GET", "talk?id=" + current_conversation + "&content=users", true);
    xmlhttp.send();
}
function addMessage(message){
var data=new Date(message.time);
document.getElementById("messagelog").innerHTML +="["+data.toLocaleTimeString()	+"] "+message.sender+ ": 	" + message.text + "<br>";}
function sendMessage(event){
	if (event.keyCode==13){
    var message = document.getElementById('message_input').innerHTML;
	document.getElementById('message_input').innerHTML="";
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
	if(xmlhttp.readyState == 4){
	    var json = JSON.parse(xmlhttp.responseText);
	    if(json.error) alert(json.error);
	}
    }
    xmlhttp.open("POST", "talk", true);
    xmlhttp.send(JSON.stringify({id: current_conversation, message: message}));
	}
}


function historyButton(id){
    return "<button onClick=\"getHistory('" + id + "')\">history</button>";
}

function sendButton(id){
    return "<button onClick=\"sendMessage('" + id + "')\">send</button>";
}

function setConversation(id){
    document.getElementById('chat').classList.remove('hidden');
    current_conversation = id;
    getHistory();
    getParticipants();
}
