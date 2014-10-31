var db = require('./db.js');
var tokens = require('./session.js');

var users;
db.event.on('load', function(){
    users = db.users;
});


function sendRequest(user, target){
    if(user.contacts.indexOf(target.login) != -1)
	return;
    if(user.outgoing.indexOf(target.login) == -1)
	user.outgoing.push(target.login);
    if(target.incoming.indexOf(user.login) == -1)
	target.incoming.push(user.login);
}

function acceptRequest(user, target){
    var index = user.incoming.indexOf(target.login);
    if(index != -1){
	user.incoming.splice(index, 1);
	user.contacts.push(target.login);
	index = target.outgoing.indexOf(user.login);
	if(index != -1) target.outgoing.splice(index, 1);
	target.contacts.push(user.login);
    }
}

function rejectRequest(user, target){
    var index;
    if((index = user.incoming.indexOf(target.login)) != -1)
	user.incoming.splice(index, 1);
}

function cancelRequest(user, target){
    var index = user.outgoing.indexOf(target.login);
    if(index != -1){
	user.outgoing.splice(index, 1);
	index = target.incoming.indexOf(user.login);
	if(index != -1) target.incoming.splice(index, 1);
    }
}

function removeContact(user, target){
    var index = user.contacts.indexOf(target.login);
    if(index != -1){
	user.contacts.splice(index, 1);
	index = target.contacts.indexOf(user.login);
	if(index != -1) target.contacts.splice(index, 1);
	target.outgoing.push(user.login);
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
			    resp.contacts[i] = {name : contact,
					       online : session.online[contact] ? 1 : 0};
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
			    resp.error = "Action not specified";
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

