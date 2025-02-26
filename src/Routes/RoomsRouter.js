const express = require('express');
const router = express.Router();
const {
    getAllRooms,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom
} = require('../Controllers/Rooms');

router.get('/rooms', getAllRooms);
router.get('/rooms/:room_id', getRoom);
router.post('/rooms', createRoom);
router.put('/rooms/:room_id', updateRoom);
router.delete('/rooms/:room_id', deleteRoom);

module.exports = router;
