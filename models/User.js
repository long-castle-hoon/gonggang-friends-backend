const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nickname: { type: String, required: true },
  profileImage: String,
  interests: [String],
  favorites: [{
    name: String,
    location: { type: [Number], index: '2dsphere' } // [경도, 위도]
  }]
});

module.exports = mongoose.model('User', UserSchema);
