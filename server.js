var http = require("http"),
    fs = require("fs");

var static_folder = "./static";

function check_static(url, serve){
    console.log(url);
    if(url == '/') serve("/main.html");
    else fs.exists(static_folder + url, function (exists) {
	if(exists) serve();
    });
}

function handle_request(req, res){
    function serve_static(url){
	fs.readFile(static_folder + (url ? url : req.url), function(err, data) {
	    if(err) throw err;
	    res.writeHead(200);
	    res.end(data);
	});
    }
    if(req.method.toLowerCase() == "get")
	check_static(req.url, serve_static);
}

http.createServer(handle_request).listen(8080);
