const passport = require('passport')

const isUser = (req,res,next)=>{
    if(req.session.user||req.user) {
        next()
    }
    else {
        res.redirect('/login')
    }
}

module.exports = isUser