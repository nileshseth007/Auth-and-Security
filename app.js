
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require("ejs");
const mongoose = require("mongoose");

//encryption package in mongoose Uses AES 
// for installing npm i mongoose-encryption 
// can encrypt and authenticate
const encrypt = require("mongoose-encryption");

const app= express();

mongoose.set("strictQuery", false);

mongoose.connect('mongodb://127.0.0.1:27017/secretsDB', function(err){
    if(err) console.log(err);
    else console.log("Connected successfully to mongoDB");
});

// object of the mongoose schema class
const userSchema = new mongoose.Schema({
    email: String,
    password: String 
})

// key for encryption (convienient in docs)
// if hacker found the file app.js then they can easily get the secret key
// this makes database vulnerable to attack hence use an env variable
// const secret = "Thisisourdirtylittlesecret";


// add plugin to our schema which encrypts the defined fields using secret as key
// plugins are extra functionality added to schema to enhance its function and power

// This must be done before defining any model eg - User
// email is not encrypted to allow searching of the details
userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User = new mongoose.model("User", userSchema);

// to make static css into dynamcic
app.use(express.static("public"));

// telling the server to see for the ejs file is a views folder
app.set("view engine", "ejs");

// allows to get into several elements of body of a request
app.use(bodyParser.urlencoded({extended:true}));

app.get('/',function(req,res){
    res.render("home");
});

app.get('/login',function(req,res){
    res.render("login");
});

app.get('/register',function(req,res){
    res.render("register");
});

// to recieve the data from form and use it directy
app.post("/register", function(req,res){
    const newUser = new User({
        email : req.body.email,
        password : req.body.password
    })

    // encrypts when a save function is executed
    // decrypts when find function is called
    newUser.save(function(err){
        if(err) console.log(err);
        else{
            res.render("secrets");
        }
    })
})

app.post("/login", function(req,res){
    const username = req.body.email;
    const password = req.body.password;

    // mongoose-encrypt decrypts when find function is used
    User.findOne({email: username}, function(err, foundUser){
        if(err) console.log(err);
        else{
            if(foundUser.password === password) res.render("secrets");
        }
    })
})

app.listen(3000,function(){
    console.log('Server is running successfully on port 3000')
});