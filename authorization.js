var sqlite = require('sqlite3');
var qs = require('querystring');

var users = new sqlite.Database('databases/users.db', function (err) {
    if(err) throw err;
    else console.log('User database opened successfully');
});

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
				   response.setHeader("Set-Cookie", "name=" + query.username);
				   resp.name = query.username;
				   response.end(JSON.stringify(resp));
			       }
			   }
			   else {
			       resp.error = "Unknown username";
			       response.end(JSON.stringify(resp));
			   }
		       });
    });
}
