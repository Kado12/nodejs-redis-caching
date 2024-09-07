const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: String,
  active: Boolean
})

const User = mongoose.model('User', userSchema, 'Users')

module.exports = User