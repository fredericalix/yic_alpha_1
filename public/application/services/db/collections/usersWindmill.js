var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var usersWindmillSchema = new Schema({
    userid:String,
    windmills: Array
});
module.exports = mongoose.model('usersWindmill', usersWindmillSchema);
