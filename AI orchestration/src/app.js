import express from 'express'
import morgan from "morgan"


const app = express()

app.use(morgan('dev'))
app.use(express.json())


app.get('/api/status/health',(req,res)=>{
    res.status(200).json({
        status: 'ok'
    })
})

app.get('/api/status/ready',(req,res)=>{
    res.status(200).json({
        status: 'ready'
    })
})

app.use("/api/ai", agentRouter
    
)

export default app