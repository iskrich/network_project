var mongo  = require('mongodb').MongoClient;
var emitter = new (require('events').EventEmitter);
exports.event = emitter;

function User(login, pass){
    this.login = login;
    this.pass = pass;
    this.contacts = [];
    this.outgoing = [];
    this.incoming = [];
    this.conversations = [];
}

var db;

mongo.connect(process.env.DATABASE_URL || "mongodb://admin:topsecret@linus.mongohq.com:10064/app30274483", function(err, DB){
    db = DB;
    if(err) throw err;
    exports.users = db.collection('users');
    console.log("Successfully connected to the MongoDB server");
    console.log("emitting to " + emitter.listeners('load').length);
    emitter.emit('load');
    // I hope it's ok to leave it open
});
