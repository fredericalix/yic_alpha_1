var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var usersHouseSchema = new Schema({
    userid: String,
    houses: Array
});
module.exports = mongoose.model('usersHouse', usersHouseSchema);
