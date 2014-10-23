var mongo  = require('mongodb').MongoClient;
var tokens = require('./session.js');

var users;

function User(login, pass){
    this.login = login;
    this.pass = pass;
    this.contacts = [];
    this.conversations = [];
}

mongo.connect("mongodb://admin:topsecret@linus.mongohq.com:10064/app30274483", function(err, db){
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
			var token = tokens.createToken(newUser);
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
		    var token = tokens.createToken(user);
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
