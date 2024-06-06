const mongoose  = require('mongoose')
const Schema = mongoose.Schema

const noteSchema = new Schema({
    title : {type : String, required : true},
    content : {type :String, required : true},
    tags : {type : [String], default : []},
    imageUrls : {type: [String] , default :[]},
    isPinned : {type: Boolean, default : true},
    valuated : {type : Boolean, default : false},
    date : {type : Date},
    userId : {type:String},
    userName : {type:String},
    category : {type : String},
    createdOn : {type:Date, default: new Date().getTime()}
})

module.exports = mongoose.model("Note", noteSchema)