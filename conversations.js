var db = require('./db.js');
var tokens = require('./session.js');
var ObjectID = require('mongodb').ObjectID;

var users, conversations;
db.event.on('load', function(){
    users = db.users;
    conversations = db.conversations;
});

function Conversation(users){
    this.users = users;
}

function Message(sender, text){
    this.sender = sender;
    this.text = text;
    this.time = new Date();
}

function isParticipant(user, id){
    for(var i = 0; i < user.contacts.length; ++i)
	if(user.contacts[i].convID == id) return true;
    return user.conversations.indexOf(id) != -1;
}

exports.create = function(users){
    var conv = new Conversation(users);
    conversations.insertOne(conv, function(err){ if(err) throw err; });
    db.getCollection("conversation" + conv._id).ensureIndex({time: 1});
    return conv._id;
};

exports.remove = function(id){
    conversations.removeOne({_id: id}, function(err){ if(err) throw err; });
    db.getCollection("conversation" + id).drop();
};

exports.conversations = function(request, response){
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
	var query = data ? JSON.parse(data) : {};
	var content = query.content || request.query.content;
	var message = query.message || request.query.message;
	var id = query.id || request.query.id;
	var token = query.token || request.token;
	var user = tokens.verify(token);
	if(!id){
	    resp.error = "No conversation specified";
	    response.end(JSON.stringify(resp));
	} else if(!user){
	    resp.error = "Invalid token";
	    response.end(JSON.stringify(resp));
	} else users.find({login: user}).next(function(err, user){
	    if(!isParticipant(user, id)){
		resp.error = "Access denied";
		response.end(JSON.stringify(resp.error));
	    } else if(request.method == "GET"){
		if(content == "users"){
		    conversations.find({_id: ObjectID.createFromHexString(id)}).next(function(err, conv){
			if(conv){
			    resp.users = conv.users;
			    response.end(JSON.stringify(resp));
			} else {
			    resp.error = "No such conversation";
			    response.end(JSON.stringify(resp));
			}
		    });
		} else if(content == "messages"){
		    var amount = query.amount || 10;
		    if(amount < 1) amount = 10;
		    db.getCollection("conversation" + id).find({}, {_id: 0})
			.sort({time: 1}).limit(amount)
			.toArray(function(err, res){
			    if(err) throw err;
			    resp.messages = res;
			    response.end(JSON.stringify(resp));
			});
		} else {
		    resp.error = "Unknown content type";
		    response.end(JSON.stringify(resp));
		}
	    } else if(request.method == "POST"){
		if(!message){
		    resp.error = "Nothing to post";
		    response.end(JSON.stringify(resp));
		} else {
		    db.getCollection("conversation" + id)
			.insert(new Message(user.login, message), 
				function(err){
				    if(err) throw err;
				    response.end(JSON.stringify(resp));
				});
		}
	    }
	});
    });
}
