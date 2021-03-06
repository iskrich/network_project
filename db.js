var mongo  = require('mongodb').MongoClient;
var emitter = new (require('events').EventEmitter);
exports.event = emitter;

var db;

mongo.connect(process.env.DATABASE_URL || "mongodb://admin:topsecret@linus.mongohq.com:10064/app30274483", function(err, DB){
    db = DB;
    if(err) throw err;

    exports.users = db.collection('users');
    exports.users.ensureIndex({login: 1});

    exports.conversations = db.collection('conversations');

    console.log("Successfully connected to the MongoDB server");
    console.log("emitting to " + emitter.listeners('load').length);
    emitter.emit('load');
    // I hope it's ok to leave it open
});

exports.getCollection = function(name){
    return db.collection(name);
}
