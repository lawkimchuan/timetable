// === server/routes/slots.js ===
const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot');

router.get('/:userId', async (req, res) => {
    const slots = await Slot.find({ userId: req.params.userId });
    res.json(slots);
});

router.get('/', async (req, res) => {
    const slots = await Slot.find();
    res.json(slots);
});

router.post('/', async (req, res) => {
    const newSlot = new Slot(req.body);
    await newSlot.save();
    res.json(newSlot);
});



router.put('/:id', async (req, res) => {
    const updated = await Slot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
});

router.delete('/:id', async (req, res) => {
    await Slot.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

module.exports = router;