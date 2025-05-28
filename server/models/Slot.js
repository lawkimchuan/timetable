// === server/models/Slot.js ===
const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema({
    userId: String,
    day: String,
    startTime: String,
    endTime: String,
    task: String,
    location: String,
    staff1: String,
    staff2: String,
});

module.exports = mongoose.model('Slot', SlotSchema);