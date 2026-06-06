const express = require("express")
const cors = require ("cors")
const interviewRouter=require("./routes/interview.routes")

const app = express()

app.use(express.json())

app.use(cors ({
    origin: function(origin ,callback){
        callback(null ,true)
    },
    credentials : true
}))
const authRouter = require("./routes/auth.routes")
app.use("/api/auth",authRouter)
app.use("/api/interview",interviewRouter)




module.exports = app