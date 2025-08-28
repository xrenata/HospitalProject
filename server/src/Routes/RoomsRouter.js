const express = require('express');
const router = express.Router();
const {
    getAllRooms,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom,
    getRoomStats
} = require('../Controllers/Rooms');

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: List all rooms.
 *     tags:
 *       - Rooms
 *     responses:
 *       200:
 *         description: Successful retrieval of rooms.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   room_id:
 *                     type: string
 *                     example: "room001"
 *                   type:
 *                     type: string
 *                     example: "ICU"
 *                   status:
 *                     type: string
 *                     example: "available"
 *       500:
 *         description: Server error
 */
router.get('/', getAllRooms);
router.get('/stats', getRoomStats);

/**
 * @swagger
 * /api/rooms/{room_id}:
 *   get:
 *     summary: Get a specific room.
 *     tags:
 *       - Rooms
 *     parameters:
 *       - in: path
 *         name: room_id
 *         required: true
 *         description: The room ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful retrieval of room.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 room_id:
 *                   type: string
 *                   example: "room001"
 *                 type:
 *                   type: string
 *                   example: "ICU"
 *                 status:
 *                   type: string
 *                   example: "available"
 *       500:
 *         description: Server error
 */
router.get('/:room_id', getRoom);

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Create a new room.
 *     tags:
 *       - Rooms
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: "ICU"
 *               status:
 *                 type: string
 *                 example: "available"
 *     responses:
 *       201:
 *         description: Room created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 room_id:
 *                   type: string
 *                   example: "room001"
 *                 type:
 *                   type: string
 *                   example: "ICU"
 *                 status:
 *                   type: string
 *                   example: "available"
 *       500:
 *         description: Server error
 */
router.post('/', createRoom);

/**
 * @swagger
 * /api/rooms/{room_id}:
 *   put:
 *     summary: Update a specific room.
 *     tags:
 *       - Rooms
 *     parameters:
 *       - in: path
 *         name: room_id
 *         required: true
 *         description: The room ID.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: "ICU"
 *               status:
 *                 type: string
 *                 example: "occupied"
 *     responses:
 *       200:
 *         description: Room updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 room_id:
 *                   type: string
 *                   example: "room001"
 *                 type:
 *                   type: string
 *                   example: "ICU"
 *                 status:
 *                   type: string
 *                   example: "occupied"
 *       500:
 *         description: Server error
 */
router.put('/:room_id', updateRoom);
router.delete('/:room_id', deleteRoom);

module.exports = router;

/**
 * @swagger
 * /api/rooms/{room_id}:
 *   delete:
 *     summary: Delete a specific room.
 *     tags:
 *       - Rooms
 *     parameters:
 *       - in: path
 *         name: room_id
 *         required: true
 *         description: The room ID.
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Room deleted successfully.
 *       500:
 *         description: Server error
 */
router.delete('/:room_id', deleteRoom);

module.exports = router;
