const mongoose = require('mongoose')
const cardSchema = new mongoose.Schema({
  question: { type: Number, required: true, unique: true },
  responses: [{ type: Boolean }]
})

module.exports = mongoose.model('card', cardSchema)
