const express = require('express');
const authRoute = require('./auth');
const socialAuth = require('./socialAuth');
const appointments = require('./appointments');
const salons = require('./salons');
const reviews = require('./reviews');
const users = require('./users');
const hostApplications = require('./hostApplications');
const follows = require('./follows');
const posts = require('./posts');
const notifications = require('./notifications');
const payments = require('./payments');

const router = express.Router();

router.use('/auth', authRoute);
router.use('/auth', socialAuth);
router.use('/appointments', appointments);
router.use('/salons', salons);
router.use('/reviews', reviews);
router.use('/users', users);
router.use('/host-applications', hostApplications);
router.use('/follows', follows);
router.use('/posts', posts);
router.use('/notifications', notifications);
router.use('/chat', require('./chat'));
router.use('/payments', payments);

module.exports = router;
