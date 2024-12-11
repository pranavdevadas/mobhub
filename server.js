const express= require('express')
const app= express()
require('dotenv').config()
const mongoose= require('mongoose')
const path= require('path')
const session= require('express-session')
const {v4:uuidv4}= require('uuid')
const nocache = require('nocache')
const adminRouter = require('./routes/adminRoutes')
const bodyParser = require('body-parser');
const passport = require('passport')



const PORT= process.env.PORT 

app.use(nocache())


//middleware to handle sesssion
app.use(session({
    secret: uuidv4(),
    resave: false,
    saveUninitialized: false,
}));

app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});

//connecting database 
const db= mongoose.connect(process.env.DB_URI)
db.then(()=>console.log('Database connected'))
db.catch(()=>console.log('Error in connecting Database'))

//link static files
app.use('/static',express.static(path.join(__dirname,'public')))


//middleware
app.use(express.json()) 
app.use(express.urlencoded({extended:false}))
app.use(passport.initialize())
app.use(passport.session())


//middleware for error handling
app.use((err, req, res, next) => {
    console.error(err.stack); 
    res.status(500).send('Something went wrong!'); 
});
  


//set template engine 
app.set('view engine','ejs')


//route prefix
app.use('/',require('./routes/userRoutes'))
app.use('/',require('./routes/adminRoutes'))



app.listen(PORT,()=>console.log(`Server running on http://localhost:${PORT}`))