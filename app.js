
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require("ejs");
const mongoose = require("mongoose");

// for managing sessions
const session = require("express-session");

// authentication package for NodeJs
const passport = require("passport");
//Mongoose plugin that simplifies building username and password login with Passport.
const passportLocalMongoose = require("passport-local-mongoose");

const app= express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
// under all the app.use/set and above the mongoose.connect
// helps creating new sessions 
app.use(session({
    secret: 'Our little secret.',
    resave: false,
    saveUninitialized: false
}));

// tell our app to start using authentication and sessions
app.use(passport.initialize());
app.use(passport.session());

mongoose.set("strictQuery", false);
mongoose.connect('mongodb://127.0.0.1:27017/secretsDB', function(err){
    if(err) console.log(err);
    else console.log("Connected successfully to mongoDB");
});

// schema must be mongoose schema in order to use passport
const userSchema = new mongoose.Schema({
    username: String,
    password: String 
})

// hash and salt the password and  then store in DB
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

// write this after the model, it provides authentication to model
passport.use(User.createStrategy());

// use to create cookie for the session and stuff user's info as msg in cookie
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/',function(req,res){
    res.render("home");
});

app.get('/login',function(req,res){
    res.render("login");
});

app.get('/register',function(req,res){
    res.render("register");
});

app.get("/logout", function(req,res){
    // callback for log out
    req.logout(function(err) {
        if (err) { 
            return next(err); 
        }
        // successfully logs out and redirect to root route
        res.redirect('/');
      });
})

app.get("/secrets", function(req,res){

    // if this page is directly accessed from root route then it autheticates and then 
    // redirects it to the secrets page
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else res.redirect("/login");
})

app.post("/register", function(req,res){
    
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err) {
            console.log(err);
            res.redirect("/register");
        }
        else{
            // authenticates the user details and redirects to secrets page
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }

    })
})

app.post("/login", function(req,res){

    const user = new User({
        username : req.body.username,
        password: req.body.password
    })
    req.login(user, function(err, user){
        if(err) {
            console.log(err);
            res.redirect("/login");
        }
        else{
            // authenticates the entered details and matched with what is stored in DB
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }

    })
})

app.listen(3000,function(){
    console.log('Server is running successfully on port 3000')
});