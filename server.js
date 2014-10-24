var http = require("http"),
    fs = require("fs"),
    users = require("./users.js"),
    url = require("url"),
    session = require('./session.js'),
    qs = require("querystring");

var static_folder = "./static";

var json_apps = {
    "/register" : users.register,
    "/login"    : users.login,
    "/contacts" : users.contactlist,
};

function check_static(url, serve, fail){
    console.log(url);
    fs.exists(static_folder + url, function (exists) {
	if(exists) serve(url);
	else fail();
    });
}

function handle_request(req, res){
    var parsedURL = url.parse(req.url);
    req.query = qs.parse(parsedURL.query);
    req.token = req.query.token || session.extract(req);
    var path = parsedURL.pathname;

    function serve_static(url){
	fs.readFile(static_folder + url, function(err, data) {
	    if(err) {
		res.writeHead(505);
		res.end();
	    }
	    res.writeHead(200);
	    res.end(data);
	});
    }

    function write404(){
	res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
	res.end("туда ли ты забрёл, пацанчик?");
    }

    if(path == "/") check_static(session.verify(req.token) ? "/main.html" : "/login.html", serve_static, write404);
    else if(json_apps[path]){
	res.json = {};
	res.setHeader("Content-Type", "application/json; charset=utf-8");
	json_apps[path](req, res);
    }
    else check_static(path, serve_static, write404);
}

http.createServer(handle_request).listen(process.env.PORT || 5000);
