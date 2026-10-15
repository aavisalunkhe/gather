const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, required: true, enum: ['Food & drink', 'Music', 'Outdoors', 'Make something', 'Community'] },
  date: { type: Date, required: true },
  endTime: { type: String, default: '' },
  location: { type: String, required: true, trim: true, maxlength: 160 },
  host: { type: String, required: true, trim: true, maxlength: 80 },
  price: { type: Number, min: 0, default: 0 },
  capacity: { type: Number, min: 1, default: 30 },
  attendees: { type: Number, min: 0, default: 0 },
  image: { type: String, default: '' },
  description: { type: String, maxlength: 1200, default: '' },
  rsvps: { type: [String], default: [], select: false },
}, { timestamps: true })

module.exports = mongoose.model('Event', eventSchema)
