var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var usersCarsSchema = new Schema({
    userid: String,
    cars: Array

});
module.exports = mongoose.model('usersCars', usersCarsSchema);
