const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviewsController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', reviewsController.createReview);
router.get('/salon/:salonId', reviewsController.getSalonReviews);
router.get('/listing/:listingId', reviewsController.getSalonReviews); // legacy alias
router.get('/user/:userId', reviewsController.getUserReviews);
router.get('/user', reviewsController.getUserReviews);
router.put('/:reviewId', reviewsController.updateReview);
router.delete('/:reviewId', reviewsController.deleteReview);
router.post('/:reviewId/response', reviewsController.addHostResponse);
router.post('/:reviewId/helpful', reviewsController.toggleHelpful);

module.exports = router;
