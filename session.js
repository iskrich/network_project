var crypto = require("crypto"),
    qs = require("querystring");

var tokens = {};
var online = {};
exports.online = online;

exports.create = function(user){
    var tokenRaw = new Date().toISOString() + "!@#$%^&*()_+" + user.login + "!@#$%^&*()_+" + user.pass;
    var token = crypto.createHash('sha256').update(tokenRaw, 'utf8').digest('hex');
    // if there's a collision, let it do whatever because I don't even
    tokens[token] = user.login;
    setTimeout(function(){ delete tokens[token]; }, 1000 * 3600 * 24);
    return token;
}

exports.verify = function(token){
    // is it bad to have it executed twice per request? probably
    if(!token) return null;
    var user = tokens[token];
    if(!user) return null;
    clearTimeout(online[user]);
    online[user] = setTimeout(function(){
	online[user] = 0;
    }, 120000);
    return user;
}

exports.extract = function(request){
    return qs.parse(request.headers.cookie).token;
}
