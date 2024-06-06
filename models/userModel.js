const mongoose  = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    fullName : {type :String},
    email : {type: String},
    password : {type : String},
    createOn : {type: Date, default : new Date().getTime()},
    admin : {type : Boolean, default : false},
    role : {type : String,}
},)

module.exports = mongoose.model("User", userSchema)