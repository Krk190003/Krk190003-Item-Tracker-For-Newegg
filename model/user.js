const mongoose = require("mongoose")
const userSchuema = new mongoose.Schema({
    email: {type: String, required: true, unique: true},
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true, unique: false},
    url: {type: String, required: false, unique: false},
    new_field: {type: Object, required: false, unique: false},
    hasItem: {type: Boolean, required: false, unique: false}
    

})

const model = mongoose.model('userSchuema', userSchuema,) //Possible err here

module.exports = model;