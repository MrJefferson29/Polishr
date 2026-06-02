const express = require('express');
const router = express.Router();
const hostAppController = require('../controllers/hostApplicationController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.post('/', verifyToken, hostAppController.submitApplication);
router.get('/me', verifyToken, hostAppController.getMyApplication);
router.get('/', verifyToken, requireAdmin, hostAppController.listApplications);
router.put('/:id/approve', verifyToken, requireAdmin, hostAppController.approveApplication);
router.put('/:id/decline', verifyToken, requireAdmin, hostAppController.declineApplication);

module.exports = router;
