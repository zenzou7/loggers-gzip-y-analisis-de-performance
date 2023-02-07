const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, max: 100 },
  password: { type: String, required: true, max: 100 },
});

const Usuarios = mongoose.model('usuarios', userSchema);
module.exports = Usuarios;
