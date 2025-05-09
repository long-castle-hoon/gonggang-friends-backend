const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: String,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [경도, 위도]
  },
  placeName: String,
  detailPlace: String,
  startTime: Date,
  endTime: Date,
  maxParticipants: Number,
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  image: String,
  notifications: [{
    message: String,
    createdAt: { type: Date, default: Date.now }
  }]
});
ActivitySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Activity', ActivitySchema);
