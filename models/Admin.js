const mongoose =require('mongoose');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema({
    name:{
        type: String,
        required:true
    },
    email:{
        type: String,
        required:true
    },
    password:{
        type:String,
        required: true
    }


});

module.exports = mongoose.model('Admin',adminSchema)
