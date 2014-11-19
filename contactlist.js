var db = require('./db.js');
var tokens = require('./session.js');
var conversations = require('./conversations.js');
var wss = require('./wss.js');

var users;
db.event.on('load', function(){
    users = db.users;
});

function findContact(user, target_login){
    for(var i = 0; i < user.contacts.length; ++i)
	if(user.contacts[i].name == target_login) return i;
    return -1;
}

function sendRequest(user, target){
    if(findContact(user, target.login) != -1)
	return;
    if(user.outgoing.indexOf(target.login) == -1)
	user.outgoing.push(target.login);
    if(target.incoming.indexOf(user.login) == -1){
	target.incoming.push(user.login);
	wss.send(target.login, JSON.stringify({
	    action: "friend_request",
	    user: user.login,
	}));
    }
}

function acceptRequest(user, target){
    var index = user.incoming.indexOf(target.login);
    if(index != -1){
	var conv = conversations.create([user.login, target.login]);
	user.incoming.splice(index, 1);
	user.contacts.push({name: target.login, convID: conv});
	index = target.outgoing.indexOf(user.login);
	if(index != -1) target.outgoing.splice(index, 1);
	target.contacts.push({name: user.login, convID: conv});
	wss.send(target.login, JSON.stringify({
	    action: "request_accept",
	    user: user.login,
	    status: wss.clients[user.login] ? 1 : 0,
	}));
    }
}

function rejectRequest(user, target){
    var index;
    if((index = user.incoming.indexOf(target.login)) != -1){
	user.incoming.splice(index, 1);
	index = target.outgoing.indexOf(user.login);
	if(index != -1){
	    target.outgoing.splice(index, 1);
	    wss.send(target.login, JSON.stringify({
		action: "request_reject",
		user: user.login,
	    }));
	}
    }
}

function cancelRequest(user, target){
    var index = user.outgoing.indexOf(target.login);
    if(index != -1){
	user.outgoing.splice(index, 1);
	index = target.incoming.indexOf(user.login);
	if(index != -1){
	    target.incoming.splice(index, 1);
	    wss.send(target.login, JSON.stringify({
		action: "request_cancel",
		user: user.login,
	    }));
	}
    }
}

function removeContact(user, target){
    var index = findContact(user, target.login);
    if(index != -1){
	conversations.remove(user.contacts[index].convID);
	user.contacts.splice(index, 1);
	index = findContact(target, user.login);
	if(index != -1){
	    target.contacts.splice(index, 1);
	    wss.send(target.login, JSON.stringify({
		action: "contact_remove",
		user: user.login,
	    }));
	}
    }
}

var contactlist_actions = {
    "request": sendRequest,
    "accept": acceptRequest,
    "reject": rejectRequest,
    "cancel": cancelRequest,
    "remove": removeContact,
}

exports.contactlist = function(request, response){
    var data = '';
    var resp = response.json;
    request.on('readable', function(){
	var d = request.read();
	if(d){
	    if(typeof d == 'string') data += d;
	    else if(d instanceof Buffer) data += d.toString('utf-8');
	}
    });
    request.on('end', function(){
	var query = data ? JSON.parse(data) : {};
	var token = query.token || request.token;
	var user = tokens.verify(token);
	resp.status = "fail";
	if(!user){
	    resp.error = "Invalid token";
	    response.end(JSON.stringify(resp));
	} else {
	    users.find({login : user}).next(function(err, this_user){
		if(err) throw err;
		if(!this_user){
		    resp.error = "You were deleted";
		    response.end(JSON.stringify(resp));
		} else {
		    if(request.method == "GET"){
			resp.status = "success";
			resp.contacts = new Array(this_user.contacts.length);

			var contact;
			for(var i = 0; i < this_user.contacts.length; ++i){
			    contact = this_user.contacts[i];
			    resp.contacts[i] = {name : contact.name,
						conv : contact.convID,
						online : wss.clients[contact.name] ? 1 : 0};
			}

			resp.incoming = new Array(this_user.incoming.length);
			for(var i = 0; i < this_user.incoming.length; ++i)
			    resp.incoming[i] = {name : this_user.incoming[i]};

			resp.outgoing = new Array(this_user.outgoing.length);
			for(var i = 0; i < this_user.outgoing.length; ++i)
			    resp.outgoing[i] = {name : this_user.outgoing[i]};

			response.end(JSON.stringify(resp));
		    } else if(request.method == "POST"){
			if(!query.action || !query.target){
			    resp.error = "Action or target not specified";
			    response.end(JSON.stringify(resp));
			} else if(query.target == user){
			    resp.error = "Don't send requests to yourself, silly";
			    response.end(JSON.stringify(resp));
			} else users.find({login : query.target}).next(function(err, target_user){
			    if(err) throw err;
			    if(!target_user){
				resp.error = "No such user";
				response.end(JSON.stringify(resp));
			    } else {
				contactlist_actions[query.action](this_user, target_user);
				users.updateOne({login: this_user.login}, this_user,
						function(err){ if(err) throw err; });
				users.updateOne({login: target_user.login}, target_user,
						function(err){ if(err) throw err; });
				resp.status = "success";
				response.end(JSON.stringify(resp));
			    }
			});
		    }
		}
	    });
	}
    });
}
