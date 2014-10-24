var crypto = require("crypto"),
    qs = require("querystring");

var tokens = {};

exports.create = function(user){
    var tokenRaw = new Date().toISOString() + "!@#$%^&*()_+" + user.login + "!@#$%^&*()_+" + user.pass;
    var token = crypto.createHash('sha256').update(tokenRaw, 'utf8').digest('hex');
    // if there's a collision, let it do whatever because I don't even
    tokens[token] = user.login;
    setTimeout(function(){ delete tokens[token]; }, 1000 * 3600 * 24);
    return token;
}

exports.verify = function(token){
    return tokens[token];
}

exports.extract = function(request){
    return qs.parse(request.headers.cookie).token;
}
