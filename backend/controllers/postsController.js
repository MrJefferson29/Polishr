const Post = require('../models/post');
const Salon = require('../models/salon');
const Follow = require('../models/follow');
const cloudinary = require('cloudinary').v2;
const NotificationService = require('../services/notificationService');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

exports.createPost = async (req, res) => {
  try {
    if (req.user.role !== 'host' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only hosts can create posts' });
    }

    const salon = await Salon.findOne({ owner: req.user._id });
    if (!salon) {
      return res.status(400).json({ message: 'Create your salon profile before posting' });
    }

    let imageUrls = [];
    if (req.files && req.files.length) {
      if (req.files.length > 4) {
        return res.status(400).json({ message: 'Maximum 4 images per post' });
      }
      for (const file of req.files) {
        const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(base64, { folder: 'salon-posts' });
        imageUrls.push(result.secure_url);
      }
    }

    const post = await Post.create({
      author: req.user._id,
      salon: salon._id,
      content: req.body.content,
      images: imageUrls,
    });

    await post.populate([
      { path: 'author', select: 'firstName lastName profileImage' },
      { path: 'salon', select: 'name placeImages city' },
    ]);

    try {
      await NotificationService.createPostNotification(post._id);
    } catch (e) {
      console.error('Post notification error:', e);
    }

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const follows = await Follow.find({ follower: req.user._id }).select('following');
    const hostIds = follows.map((f) => f.following);

    if (!hostIds.length) {
      return res.json([]);
    }

    const posts = await Post.find({ author: { $in: hostIds } })
      .populate('author', 'firstName lastName profileImage')
      .populate('salon', 'name placeImages city')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getPostsByHost = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.hostId })
      .populate('author', 'firstName lastName profileImage')
      .populate('salon', 'name placeImages city')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .populate('salon', 'name placeImages')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.body.content) post.content = req.body.content;
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
