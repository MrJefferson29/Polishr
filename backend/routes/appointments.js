const express = require('express');
const router = express.Router();
const appointmentsController = require('../controllers/appointmentsController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, appointmentsController.getGuestAppointments);
router.get('/user', verifyToken, appointmentsController.getGuestAppointments);
router.get('/host', verifyToken, appointmentsController.getHostAppointments);
router.post('/', verifyToken, appointmentsController.createAppointment);
router.delete('/:id', verifyToken, appointmentsController.cancelAppointment);

router.get(
  '/check-availability/:salonId/:startTime/:duration',
  verifyToken,
  appointmentsController.checkAvailability
);
router.get('/salon/:salonId/booked-slots', verifyToken, appointmentsController.getSalonAppointments);
router.get('/verify-payment/:sessionId', verifyToken, appointmentsController.verifyPayment);
router.post('/cancel-payment/:sessionId', verifyToken, appointmentsController.cancelPayment);
router.get('/:id', verifyToken, appointmentsController.getAppointmentById);

module.exports = router;
