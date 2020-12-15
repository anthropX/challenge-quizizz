const express = require('express')
const app = express()
const connectDB = require('./config/db')
const playRouter = require('./routes/api/play')
const port = process.env.PORT || 3090

// Connect Database
connectDB()

app.use(express.json())

// Routers
app.use('/play', playRouter)

app.listen(port, function () {
  console.log(`Server started listening to port ${port}`)
})
