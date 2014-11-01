var db = require('./db.js');
var tokens = require('./session.js');

var users;

db.event.on('load', function(){
    users = db.users;
});

function User(login, pass){
    this.login = login;
    this.pass = pass;
    this.contacts = [];
    this.outgoing = [];
    this.incoming = [];
    this.conversations = [];
}

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
	else users.find({login: query.username}).next(function(err, res){
	    if(err) throw err;
	    if(res){
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
	else users.find({login: query.username}).next(function(err, user){
	    if(err) throw err;
	    if(user){
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
