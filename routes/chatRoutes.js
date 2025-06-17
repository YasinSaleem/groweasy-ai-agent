// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/start', chatController.startChat.bind(chatController));
router.post('/continue', chatController.continueChat.bind(chatController));

module.exports = router;