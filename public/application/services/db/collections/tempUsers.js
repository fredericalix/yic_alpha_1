var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var tempUserSchema = new Schema({
    userid: String,
    userName: String,
    fullName: String,
    email: String,
    timestamp: 0
});
module.exports = mongoose.model('tempUsers', tempUserSchema);
