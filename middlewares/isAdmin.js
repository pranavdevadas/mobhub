const express = require('express')
const app = express()
const path = require('path')

app.use('/static',express.static(path.join(__dirname,'public')))

const isAdmin = (req,res,next)=>{
    if(!req.session.admin){
     res.render('admin/adminLogin')
    }
    else{
        next()
    }
}

module.exports = isAdmin