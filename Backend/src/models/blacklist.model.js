const mongoose = require('mongoose')

const blacklistTokenSchema = new mongoose.Schema({
    token:{
        type:String,
        required:[ true,"token is required to be added in Blacklist"]
    }
    },{
        timestamps: true
    
})

const tokenBlacklistModel = mongoose.model("blacklistTokens" , blacklistTokenSchema)


module.exports = tokenBlacklistModel