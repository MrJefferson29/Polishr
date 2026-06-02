const express = require('express');
const router = express.Router();
const salonsController = require('../controllers/salonsController');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) cb(null, true);
  else cb(new Error('Only images are allowed'));
};
const upload = multer({ storage, fileFilter });

router.get('/', salonsController.getAllSalons);
router.get('/popular', salonsController.getPopularSalons);
router.get('/nearby', salonsController.getNearbySalons);
router.get('/my-salon', verifyToken, authorizeRole('host', 'admin'), salonsController.getMySalon);
router.get('/:id', salonsController.getSalonById);

router.post(
  '/',
  verifyToken,
  authorizeRole('host', 'admin'),
  upload.fields([
    { name: 'placeImages', maxCount: 10 },
    { name: 'workImages', maxCount: 10 },
  ]),
  salonsController.createSalon
);

router.put(
  '/:id',
  verifyToken,
  authorizeRole('host', 'admin'),
  upload.fields([
    { name: 'placeImages', maxCount: 10 },
    { name: 'workImages', maxCount: 10 },
  ]),
  salonsController.updateSalon
);

router.post('/:salonId/deactivate', verifyToken, salonsController.deactivateSalon);
router.post('/:salonId/activate', verifyToken, salonsController.activateSalon);

module.exports = router;
