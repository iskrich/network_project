var sqlite = require("sqlite3"),
    crypto = require("crypto"),
    qs = require("querystring");

var db = new sqlite.Database(":memory:", function(err){
    console.log("In-memory database for tokens created");
    db.run("create table tokens (token TEXT UNIQUE, userID integer, expires DATETIME);");
    setInterval(function (){
	console.log("removing expired tokens");
	db.run("delete from tokens where expires > datetime();");
    }, 1000 * 3600 * 24);
});

exports.createToken = function(login, pass, id){
    var tokenRaw = new Date().toISOString() + "!@#$%^&*()_+" + login + "!@#$%^&*()_+" + pass;
    var token = crypto.createHash('sha256').update(tokenRaw, 'utf8').digest('hex');
    // if there's a collision, let it break because I don't even
    db.run("insert into tokens values (?, ?, datetime('now', '1 days'))", token, id);
    return token;
}

exports.verifyToken = function(token){
    db.get("select userID, expires from tokens where token = ?", token, function(err, row){
	console.log(row);
	if(Date.parse(row.expires) < Date.now()) return 0;
	else return row.userID;
    });
}

exports.extractToken = function(request){
    return qs.parse(request.headers.cookie).token;
}
