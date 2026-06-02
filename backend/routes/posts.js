const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postsController');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/feed', verifyToken, postsController.getFeed);
router.get('/my-posts', verifyToken, authorizeRole('host', 'admin'), postsController.getMyPosts);
router.get('/host/:hostId', postsController.getPostsByHost);
router.post('/', verifyToken, authorizeRole('host', 'admin'), upload.array('images', 4), postsController.createPost);
router.put('/:id', verifyToken, authorizeRole('host', 'admin'), postsController.updatePost);
router.delete('/:id', verifyToken, postsController.deletePost);

module.exports = router;
