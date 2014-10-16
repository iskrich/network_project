var sqlite = require('sqlite3');
var qs = require('querystring');
var tokens = require('./session.js');

var users = new sqlite.Database('databases/users.db', function (err) {
    if(err) throw err;
    else console.log('User database opened successfully');
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
	var query = qs.parse(data);
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
	else users.get("select * from users where username = ?", query.username,
		       function(err, row){
			   if(err) throw err;
			   if(row){
			       resp.error = "Username has already been taken";
			       response.end(JSON.stringify(resp));
			   }
			   else {
			       users.run("insert into users (username, password) values (?, ?)", query.username, query.password, function (err){
				   if(err){
				       resp.error = "Some error while running register query";
				       response.end(JSON.stringify(resp));
				   } else {
				       var token = tokens.createToken(query.username, query.password, this.lastID);
				       response.setHeader("Set-Cookie", "token=" + token + "&name=" + query.username);
				       resp.token = token;
				       resp.name = query.username;
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
	var query = qs.parse(data);
	if(!query.username || !query.password){
	    resp.error = "Wrong format";
	    response.end(JSON.stringify(resp));
	}
	else users.get("select * from users where username = ?", query.username,
		       function(err, row){
			   if(err) throw err;
			   if(row){
			       if(query.password != row.password){
				   resp.error = "Wrong password";
				   response.end(JSON.stringify(resp));
			       } else {
				   var token = tokens.createToken(row.username, row.password, row.id);
				   response.setHeader("Set-Cookie", "token=" + token + "&name=" + query.username);
				   resp.token = token;
				   resp.name = query.username;
				   response.end(JSON.stringify(resp));
			       }
			   } else {
			       resp.error = "Unknown username";
			       response.end(JSON.stringify(resp));
			   }
		       });
    });
}
