var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userSchema = new Schema({
    userid: String,
    userName: String,
    fullName: String,
    password:String,
    email: String,
    token: String,
    siotoken:String,
    timestamp: 0,
    activation: false
});

var Users = mongoose.model('users', userSchema);

module.exports = Users;
