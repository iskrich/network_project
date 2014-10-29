var mongo  = require('mongodb').MongoClient;
var tokens = require('./session.js');

var users;

function User(login, pass){
    this.login = login;
    this.pass = pass;
    this.contacts = [];
    this.outgoing = [];
    this.incoming = [];
    this.conversations = [];
}

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

mongo.connect(process.env.DATABASE_URL || "mongodb://admin:topsecret@linus.mongohq.com:10064/app30274483", function(err, db){
    if(err) throw err;
    users = db.collection('users');
    console.log("Successfully connected to the MongoDB server");
    // I hope it's ok to leave it open
});

function validLogin(login){
    return login.match(/^[a-zA-Z0-9_.]+$/);
}

function validPass(pass){
    return pass.match(/^[a-zA-Z0-9.!@#$%^&*()_+]+$/);
}

exports.register = function(request, response){
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
	var query = JSON.parse(data);
	if(!query.username || !query.password){
	    resp.error = "Wrong format";
	    response.end(JSON.stringify(resp));
	} else if(!validLogin(query.username)){
	    resp.error = "Wrong login format";
	    response.end(JSON.stringify(resp));
	} else if(!validPass(query.password)){
	    resp.error = "Wrong password format";
	    response.end(JSON.stringify(resp));
	}
	else users.find({login: query.username}).toArray(function(err, res){
	    if(err) throw err;
	    if(res.length > 0){
		resp.error = "Username has already been taken";
		response.end(JSON.stringify(resp));
	    } else {
		var newUser = new User(query.username, query.password);
		users.insertOne(newUser, function (err){
		    if(err){
			resp.error = "Some error while running register query";
			response.end(JSON.stringify(resp));
		    } else {
			var token = tokens.create(newUser);
			response.setHeader("Set-Cookie", "token=" + token);
			resp.token = token;
			response.end(JSON.stringify(resp));
		    }
		});
	    }
	});
    });
}

exports.login = function(request, response){
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
	var query = JSON.parse(data);
	if(!query.username || !query.password){
	    resp.error = "Wrong format";
	    response.end(JSON.stringify(resp));
	}
	else users.find({login: query.username}).toArray(function(err, res){
	    if(err) throw err;
	    if(res.length > 0){
		var user = res[0];
		if(query.password != user.pass){
		    resp.error = "Wrong password";
		    response.end(JSON.stringify(resp));
		} else {
		    var token = tokens.create(user);
		    response.setHeader("Set-Cookie", "token=" + token);
		    resp.token = token;
		    response.end(JSON.stringify(resp));
		}
	    } else {
		resp.error = "Unknown username";
		response.end(JSON.stringify(resp));
	    }
	});
    });
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
	    users.find({login : user}).toArray(function(err, res){
		if(err) throw err;
		if(res.length == 0){
		    resp.error = "You were deleted";
		    response.end(JSON.stringify(resp));
		} else {
		    var this_user = res[0];
		    if(request.method == "GET"){
			resp.status = "success";
			resp.contacts = new Array(this_user.contacts.length);

			for(var i = 0; i < this_user.contacts.length; ++i)
			    resp.contacts[i] = {name : this_user.contacts[i]};

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
			    resp.error = "Don't send request to yourself, silly";
			    response.end(JSON.stringify(resp));
			} else users.find({login : query.target}).toArray(function(err, res){
			    if(err) throw err;
			    var target_user = res[0];
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
