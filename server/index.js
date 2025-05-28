// === server/index.js ===
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const slotRoutes = require('./routes/slots');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/timetable');

app.use('/api/slots', slotRoutes);

app.listen(5001, () => console.log('Server running on port 5001'));