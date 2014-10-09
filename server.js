var http = require("http"),
    fs = require("fs"),
    auth = require("./authorization.js"),
    url = require("url");

var static_folder = "./static";

var json_apps = {
    "/register" : auth.register,
    "/login" : auth.login
};

function check_static(url, serve){
    console.log(url);
    fs.exists(static_folder + url, function (exists) {
	if(exists) serve();
    });
}

function handle_request(req, res){
    var path = url.parse(req.url).pathname;
    function serve_static(url){
	fs.readFile(static_folder + (url ? url : path), function(err, data) {
	    if(err) {
		res.writeHead(505);
		res.end();
	    }
	    res.writeHead(200);
	    res.end(data);
	});
    }

    if(path == "/") serve_static("/main.html");
    else if(json_apps[path]){
	res.json = {};
	res.setHeader("Content-Type", "application/json");
	json_apps[path](req, res);
    }
    else if(req.method.toLowerCase() == "get")
	check_static(path, serve_static);
}

http.createServer(handle_request).listen(process.env.PORT || 5000);
