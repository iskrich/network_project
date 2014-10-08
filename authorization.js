var sqlite = require('sqlite3');
var qs = require('querystring');

var users = new sqlite.Database('databases/users.db',
				function (err) {
				    if(err) throw err;
				    else console.log('Database opened successfully');
				});

exports.register = function(request, response){
    var data = '';

    request.on('readable', function(){
	var d = request.read();
	if(d){
	    if(typeof d == 'string') data += d;
	    else if(d instanceof Buffer) data += d.toString('utf-8');
	}
    });
    request.on('end', function(){
	var query = qs.parse(data);
	console.log("Got register request:");
	console.log(query);
	if(!query.username || !query.password){
	    console.log("Wrong format");
	    response.end("Wrong format");
	}
	else users.get('select * from users where username = ?', query.username,
		       function(err, row){
			   if(err) throw err;
			   if(row){
			       console.log("Username has already been taken");
			       response.end("username already taken");
			   }
			   else {
			       users.run("insert into users values (?, ?)", query.username, query.password, function (err){
				   if(err){
				       console.log("Some error while running register query");
				       response.end("oh noes");
				   } else {
				       console.log("Should be registered");
				       response.end("yay");
				   }
			       });
			   }
		       }); 
    });
}

exports.login = function(request, response){
    var data = '';

    request.on('readable', function(){
	var d = request.read();
	if(d){
	    if(typeof d == 'string') data += d;
	    else if(d instanceof Buffer) data += d.toString('utf-8');
	}
    });
    
    request.on('end', function(){
	var query = qs.parse(data);
	console.log("Got log in request:");
	console.log(query);
	if(!query.username || !query.password){
	    console.log("Wrong format");
	    response.end("Wrong format");
	}
	else users.get('select * from users where username = ?', query.username,
		       function(err, row){
			   if(err) throw err;
			   if(row){
			       console.log("Username found");
			       if(query.password != row.password){
				   console.log("Wrong password");
				   response.end("Wrong password");
			       } else {
				   console.log("Logged in successfully");
				   response.end("Enjoy being logged in");
			       }
			   }
			   else {
			       console.log("No such user");
			       response.end("Unknown username");
			   }
		       }); 
    });
}
