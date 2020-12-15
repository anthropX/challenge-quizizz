const mongoose = require('mongoose')
const uri = require('config').get('mongoURI')

async function connectDB () {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log('MongoDB connected!')
  } catch (error) {
    console.error(error.message)
    // Exit process with failure
    process.exit(1)
  }
}

module.exports = connectDB
