var session = require('./session.js');
var conv = require('./conversations.js');
var db = require('./db.js');

var users;
var conversations;
db.event.on('load', function(){
    users = db.users;
    conversations = db.conversations;
});

var clients = {};
exports.clients = clients;

function verifyClient(info){
    return session.verify(info.req.url.substr(1));
}

function send(target, message){
    console.log("sending to " + target + ": " + message);
    if(clients[target]) clients[target].forEach(function(ws){
	ws.send(message);
    });
}
exports.send = send;

function broadcastContacts(user, message, self){
    console.log("broadcasting to " + user + "'s contacts: " + message);
    if(self) send(user, message);
    
    users.find({login: user}).next(function(err, user){
	if(err) throw err;
	user.contacts.forEach(function(contact){
	    send(contact.name, message);
	});
    });
}

exports.init = function(server){
    wsServer = new (require('ws').Server)({
	server: server,
	verifyClient: verifyClient
    });

    wsServer.on('connection', function(ws){
	var token = ws.upgradeReq.url.substr(1);
	var user = session.verify(token);
	if(clients[user]) clients[user].push(ws);
	else {
	    clients[user] = [ws];
	    broadcastContacts(user, JSON.stringify({
		action: "status_change",
		user: user,
		status: 1,
	    }), false);
	}
	ws.on('message', function(data){
	    console.log(data);
	});
	ws.on('close', function(){
	    if(clients[user].length == 1) {
		delete clients[user];
		broadcastContacts(user, JSON.stringify({
		    action: "status_change",
		    user: user,
		    status: 0,
		}), false);
	    }
	    else {
		var index = clients[user].indexOf(ws);
		clients[user].splice(index, 1);
	    }
	});
    });
}
