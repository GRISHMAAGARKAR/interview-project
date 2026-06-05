const express = require("express")
const cookieParser =require("cookie-parser")
const cors = require ("cors")
const interviewRouter=require("./routes/interview.routes")

const app = express()

app.use(express.json())
app.use(cookieParser())

app.use(cors ({
    origin: "https://interview-project-2-azure.vercel.app",
    credentials : true
}))
const authRouter = require("./routes/auth.routes")
app.use("/api/auth",authRouter)
app.use("/api/interview",interviewRouter)




module.exports = app