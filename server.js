require('dotenv').config()

const mongoose = require("mongoose")

mongoose.connect(process.env.DB_STRING)

const User = require("./models/userModel")
const Note = require('./models/noteModel')
const express = require('express')
const cors = require("cors")
const app = express()

const jwt = require("jsonwebtoken")
const {authenticateToken} = require("./utilities")

app.use(express.json())

app.use(
    cors({
        origin: "*"
    })
)

app.post('/create-account',async (req,res)=> {
    const {fullName, email, password} = req.body
    if(!fullName) {
        return res.status(400).json({error: true, message : "Full Name is required"})
    }
    if(!email) {
        return res.status(400).json({error: true, message: "Email is required"})
    }
    if(!password) {
        return res.status(400).json({error: true, message: "Password is required"})
    }

    const isUser = await User.findOne({email: email})
    
    if (isUser){
        return res.json({
            error: true,
            message : "User already exist"
        })
    }
    
    const user = new User({
        fullName,
        email,
        password
    })

    await user.save()

    const accessToken = jwt.sign({user}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn : "36000m"
    })

    return res.json({
        error:false,
        user,
        accessToken,
        message: "Registration Successful"
    })
})

app.post('/login', async(req,res)=>{
  const {email, password} = req.body
  if(!email) {
    return res.status(400).json({error: true, message: "Email is required"})
  }
  if(!password) {
    return res.status(400).json({error: true, message: "password is required"})
  }

  const userInfo = await User.findOne({email : email})

  if(!userInfo) {
    return res.status(400).json({error :true, message : "User not found"})
  }
 
  if(userInfo.email == email && userInfo.password == password) {
    const user = {user : userInfo}
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn : "36000M"
    })
    
   
  
    return res.json({
        error : false,
        message: "Login Successful",
        email,
        accessToken,
        isAdmin : userInfo.admin
    })

  }else {
    return res.json({
        error : true,
        message : "Invalid Credentials"
    })
  }
})

app.get("/get-user", authenticateToken, async (req,res)=> {
   
    const {user} = req.user
    const isUser = await User.findOne({_id: user._id})

    if(!isUser) {
        return res.sendStatus(401)
    }
    return res.json({
        user : {fullName : isUser.fullName,
                email : isUser.email,
                isAdmin : isUser.admin,
                createdOn : isUser.createOn},
        message : "validated"
    })
})

//get all notes
app.get('/get-all-Notes',authenticateToken, async (req,res)=>{
    const {user} = req.user
   
    try {
        const notes = await Note.find({userId : user._id}).sort({date : -1})

        return res.json({
            error : false,
            notes,
            message : "All notes retrived successfully"
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            error: true,
            message : "Internerl server error"
        })
    }
})

//get all users
app.get('/get-All-Users', async(req,res)=>{
    const usersFromDb = await User.find()
    const users = usersFromDb.filter((u) => u.fullName !== "admin")
    res.json({
        error : false,
        users,
        message : "all users selected"
    })
})

//get all notes for admin
app.get('/get-admin-notes',authenticateToken, async (req,res)=>{
    //const {user} = req.user
   
    try {
        const notes = await Note.find().sort({verified : -1})

        return res.json({
            error : false,
            notes,
            message : "All notes retrived successfully"
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            error: true,
            message : "Internerl server error"
        })
    }
})


app.post("/add-note",authenticateToken, async(req,res)=> {
 const {title, content, tags, imageUrls, date, category} = req.body
 const {user} = req.user
 if(!title) {
    return res.status(400).json({error: true, message:"Title is required"})
 }
 if(!content) {
    return res.status(400).json({error: true, message:"Content is required"})
 }
 if(!imageUrls) {
    return res.status(400).json({error: true, message:"Images is required"})
 }
 console.log(user.fullName)
 try {
    const note = new Note({
        title,
        content,
        tags : tags || [],
        imageUrls : imageUrls || [],
        date,
        userId : user._id,
        userName : user.fullName,
        category
    })

    await note.save()

    return res.json({
        error :false,
        note,
        message : "Note added successfully"
    })
 
 } catch (error) {
    console.log(error)
    return res.status(500).json({
        error: true,
        message : "Invlalid server error"
    })
 }
})

app.put('/edit-note/:note_id', async(req,res)=> {
    const noteId = req.params.note_id
    const {title, content, tags, isPinned} = req.body
    const {user} = req.user

    if (!title && !content && !tags) {
        res.status(400).json({
            error:true,
            message : "No changes Priovided"
        })
    }
    try {
        const note = await Note.findOne({_id : noteId, userId : user._id})

        if (!note) {
            res.status(404).json({error : true, message : "Note not found"})
        }

        if (title) note.title = title
        if (content) note.content = content
        if(tags) note.tags = tags
        if(isPinned) note.isPinned = isPinned

        await note.save()

        return res.json({
            error : false,
            note,
            message : "Note updated succesfully"
        })
    } catch (error) {
        return res.status(500).json({
            error: true,
            message : "Internal Server Error"
        })}
})

//valuate note
app.put('/valuate/:noteId', authenticateToken, async(req,res)=>{
    const noteId = red.params.noteId
    const {valuated} = req.body
    const note = await Note.findOne({_id : noteId})
    if (!note) {
        return res.status(404).json({error :true,  message:"note not found"})
    }
    try {
        if (valuated) note.valuated = valuated
    await note.save()

    return res.json({
        error : false,
        note,
        message : "Note updated succesfully"
    })
    } catch (error) {
        return res.status(500).json({
            error: true,
            message : "Internal Server Error"
        })
    }  
})

app.get('/search-notes', authenticateToken, async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({
            error: true,
            message: "Search query is required"
        });
    }

    const searchQuery = query.toString();

    try {
        const matchingNotes = await Note.find({
            userId: searchQuery
        });

        return res.status(200).json({
            error: false,
            notes: matchingNotes
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error"
        });
    }
});

//note delete api
app.delete("/delete-note/:noteId", authenticateToken,async (req, res)=>{
    const noteId = req.params.noteId    
    const {user} = req.user
    console.log(noteId)
    try {
        const note = await Note.findOne({_id : noteId, userId : user._id})
        if (!note){
            return  res.status(404).json({error : true, message : "note not found"})
        }
        await Note.deleteOne({_id : noteId, userId : user._id})
        return res.json({error : false,message :  "Note deleted successfully"})
    } catch (error) {
        return res.status(500).json({
            error : true, message : "Internal server error"
        })
    }
})
//valuate note
app.put('/valuate-note/:noteId', async (req, res) => {
    const { noteId } = req.params;
    try {
      const note = await Note.findById(noteId);
      if (!note) {
        return res.status(404).json({ error: true, message: 'Note not found' });
      }
      
      // Update the note's valuated status
      note.valuated = true;
      await note.save();
  
      return res.status(200).json({ error: false, message: 'Note valuated successfully', note });
    } catch (error) {
      console.error('Error valuating note:', error);
      return res.status(500).json({ error: true, message: 'Internal server error' });
    }
  });
  
app.listen(8000)

module.exports = app