const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const scrapper = require('./scrapper');
const mongoose = require('mongoose');
const User = require('./model/user');
const bcrypt = require('bcryptjs');
const JWT_SECRET = "jajfjklasnj$#%#^&^@jnaksj;nsak%$@#54klnq@#%can48o@%#58h9149h1v";
const nodemailer = require('nodemailer');
const passport = require('passport')
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const { updateMany, findByIdAndUpdate, findOneAndUpdate } = require('./model/user');


let urlw;
let itemData;
let keys = [];
let temp = "";
let t ="";
let hasItem = false;








setInterval(async () => {
    for(let i =0; i<keys.length; i++){
        data1 = await User.findOne({username: keys[i]});
        itemData = await scrapper.retrieveItemInfo(data1.url);
        let doc = await User.findOneAndUpdate({ username: keys[i] }, { new_field: itemData});
        
    }

}, 30000)




//Connect To Database 
let db = mongoose.connect('mongodb://localhost:27017/Price-Tracking-Database', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
})

//Connect the server
app.listen(PORT, () => { console.log(`Success Listening on Port ${PORT}`) });

//Automatic Mailer 
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'tjuvmio@gmail.com',
        pass: 'tbsstcomefrymlzn'
    }
});
var mailOptions = {
    from: 'youremail@gmail.com',
    to: '',
    subject: 'Sending Email using Node.js',
    text: 'That was easy!'
};






//Ejs Template
app.set('view engine', 'ejs')

//BodyParser 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//Express Session 
app.use(session({
secret: JWT_SECRET, 
resave: false, 
saveUninitialized: false, }));
//passport middleware
app.use(passport.initialize())
app.use(passport.session());






//Passport initialization 

passport.use(new LocalStrategy({usernameField: "username"},(username, password, done) => {
    User.findOne({username: username}).then(user =>{
        if(!user){
            return(done(null, false, {message: "Username is Incorrect"}))
        }
        bcrypt.compare(password, user.password, (err, isMatch)=>{
            if(err){
                console.log("Error on Password Comparison")
                throw err
            }
            if(isMatch){
                
                return done(null, user)
            }
            else{
                return done(null, false, {message: "Password is Incorrect"})
            }
        })
        
    }).catch(err => {
        console.log("Error in Checking Database")
        throw err
    })
}))

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

//Middleware to Protect Routes 

function checkAuth(req, res, next){
    if(req.isAuthenticated()){
        return next()
    }
   res.redirect('/login')
}

function checkNotAuth(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect('/home')
    }
   next()
}


async function doesUserHaveItem(req, res, next){
        console.log(req.user.username);
        await User.findOne({username: req.user.username},(err, docs)=>{
            console.log(docs)
            if(docs.hasItem === false){
                return next()
            }
            else{
                
                res.redirect("/itemPage")
            }
        })
        

    
}




app.post("/register", checkNotAuth, async (req, res) => {
   
    let newUserData = {};
    newUserData.email = req.body.email
    newUserData.username = req.body.username
    newUserData.password = await bcrypt.hash(req.body.password, 10);
    newUserData.hasItem = false;



    if (req.body.password.length < 7) {
        //res.json({ status: "Error", errorCause: "Password is too short" })
        res.render("registerPage.ejs", {err: "Password is too short"})
        
    }
    else {
        try {
             await User.create(newUserData)
             res.render("registerPage.ejs", {err: "Successfully Registered Your Account, Please Log in"})
            
        } catch (error) {
            if (error.code === 11000) {
                //return res.json({ status: "Error", errorCause: "Email and/or Username already in use" })
                res.render("registerPage.ejs", {err: "Email and/or Username already in use"})
            }
            else {
                throw error
            }

        }
    }


})



app.post('/login', (req, res, next) => {
    temp = req.body;
    passport.authenticate('local', {
        successRedirect: '/home',
        failureRedirect: '/register'
    })(req, res, next)
})

//Gets the initial data of the product upon url entry 
app.post("/api", async (req, res,) => {
    hasItem = true;
    if(!(keys.includes(temp.username))){
        keys[keys.length] = temp.username;
    }

    mailOptions.to;
    itemData = await scrapper.retrieveItemInfo(req.body.url);
    await User.findOneAndUpdate({username: temp.username}, {hasItem: true})
    await User.findOneAndUpdate({username: temp.username},{url: itemData.url})
    await User.findOneAndUpdate({username: temp.username},{new_field: itemData});

    if (itemData.status == "Error") {
        //res.render("homePage.ejs",{err: "Not a Valid Link!"});
    }
    else {
        
        urlw = req.body.url
    

        
        //res.render("statusPage.ejs", {status: t.new_field.status, price: t.new_field.price, time: t.new_field.time, image: t.new_field.imgItemUrl, name: t.new_field.name});
        res.redirect("/itemPage");
    }

});



app.get("/register", checkNotAuth, (req, res) => {
    res.render('registerPage.ejs', {err: ""})
    console.log("Page Loaded");
    
})

app.get("/itemPage", checkAuth, async (req,res) => {
   t = await User.findOne({username: temp.username});
    res.render("statusPage.ejs", {uname: t.username, status: t.new_field.status, price: t.new_field.price, time: t.new_field.time, image: t.new_field.imgItemUrl, name: t.new_field.productName});
})
    


app.get("/login", checkNotAuth, async (req, res) => {
    res.render("loginPage");
    res.end();

})




app.get("/home", checkAuth, doesUserHaveItem, async (req, res) => {
    t = await User.findOne({username: temp.username});
    res.render('homepage.ejs', {err: "", uname: t.username})
    res.end();
})

app.get("/", (req, res) => {
    res.redirect("/login")
})

//*Loads page with item data and info 
//* repeatly checks for any changes to item's data
app.get("/itemData", (req, res) => { 
    res.render("statusPage", {
        name: itemData.productName,
        price: itemData.price, 
        image: itemData.imgItemUrl, 
        status: itemData.status,
        time: itemData.time
    });
    console.log("Success");
    
});


app.get("/updateInfo", async (req, res) => {

    var previousItemData = JSON.parse(JSON.stringify(itemData));
    
    itemData = await scrapper.retrieveItemInfo(urlw)


    scrapper.output(itemData);

    if (previousItemData.price != itemData.price) {
        mailOptions.subject = `Price change on ${itemData.productName}`
        mailOptions.text = `Hello User, \n This Email is sent to notify you that the Price of ${itemData.productName} Has changed from ${previousItemData.price} to ${itemData.price} \n Buy the Item Here ${urlw}`;

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Price change Email sent: ' + info.response);
            }
        });
    }
    if ((previousItemData.status != itemData.status) && (previousItemData.status == "OUT OF STOCK.")) {
        mailOptions.subject = "Your Item is now availible to buy"
        mailOptions.text = `Hello User, \n Your Item ${itemData.productName} is now availible to be bought for ${itemData.price} \n Buy it here ${urlw}`
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Stock Availibiity Email sent: ' + info.response);
            }
        });
    }



})


app.get("/stop", async (req, res) => {
    urlw = "";
    await User.findOneAndUpdate({username: temp.username}, {hasItem: false})
    res.redirect("/home")
})


app.post('/logout',(req,res) => {
    req.logOut()
    res.redirect('/login')
})

app.get("/retrieveData", async (req, res)=>{
  let test = await (User.findOne({username: temp.username}))
  res.send((test.new_field));
})
    


    

    

//Final Goals: Find a Way to make the user dashbaord accessible, make it more custumized, fix the In Stock but x amount be bought bug, and find a way to send emails to the clients 