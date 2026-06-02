const express = require('express');
const router = express.Router();
const followsController = require('../controllers/followsController');
const { verifyToken } = require('../middleware/auth');

router.post('/:hostId', verifyToken, followsController.followHost);
router.delete('/:hostId', verifyToken, followsController.unfollowHost);
router.get('/following', verifyToken, followsController.getFollowing);
router.get('/:hostId/check', verifyToken, followsController.checkIfFollowing);
router.get('/:hostId/followers', verifyToken, followsController.getFollowers);

module.exports = router;
