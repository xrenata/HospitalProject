const express = require('express');
const router = express.Router();
const FeedbackController = require('../Controllers/Feedback');

router.get('/', FeedbackController.getAllFeedback);
router.get('/:id', FeedbackController.getFeedback);
router.post('/', FeedbackController.createFeedback);
router.put('/:id', FeedbackController.updateFeedback);
router.delete('/:id', FeedbackController.deleteFeedback);

module.exports = router;
