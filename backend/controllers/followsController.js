const Follow = require('../models/follow');
const User = require('../models/user');
const Salon = require('../models/salon');
const NotificationService = require('../services/notificationService');

exports.followHost = async (req, res) => {
  try {
    const { hostId } = req.params;
    const followerId = req.user._id;

    if (hostId === followerId.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const host = await User.findById(hostId);
    if (!host || (host.role !== 'host' && host.role !== 'admin')) {
      return res.status(404).json({ message: 'Host not found' });
    }

    const existing = await Follow.findOne({ follower: followerId, following: hostId });
    if (existing) {
      return res.status(400).json({ message: 'Already following this host' });
    }

    await Follow.create({ follower: followerId, following: hostId });
    await User.findByIdAndUpdate(hostId, { $inc: { followerCount: 1 } });

    const salon = await Salon.findOne({ owner: hostId });
    if (salon) {
      await Salon.findByIdAndUpdate(salon._id, { $inc: { followerCount: 1 } });
    }

    try {
      await NotificationService.createFollowNotification(hostId, followerId);
    } catch (e) {
      console.error('Follow notification error:', e);
    }

    res.json({ message: 'Now following host' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Already following this host' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.unfollowHost = async (req, res) => {
  try {
    const { hostId } = req.params;
    const followerId = req.user._id;

    const follow = await Follow.findOneAndDelete({ follower: followerId, following: hostId });
    if (!follow) {
      return res.status(400).json({ message: 'Not following this host' });
    }

    await User.findByIdAndUpdate(hostId, { $inc: { followerCount: -1 } });
    const salon = await Salon.findOne({ owner: hostId });
    if (salon) {
      await Salon.findByIdAndUpdate(salon._id, { $inc: { followerCount: -1 } });
    }

    res.json({ message: 'Unfollowed host' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const follows = await Follow.find({ follower: req.user._id })
      .populate({
        path: 'following',
        select: 'firstName lastName profileImage role followerCount',
      })
      .sort({ createdAt: -1 });

    const hosts = await Promise.all(
      follows.map(async (f) => {
        const salon = await Salon.findOne({ owner: f.following._id }).select('name placeImages city');
        return { host: f.following, salon, followedAt: f.createdAt };
      })
    );

    res.json(hosts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.checkIfFollowing = async (req, res) => {
  try {
    const { hostId } = req.params;
    const follow = await Follow.findOne({ follower: req.user._id, following: hostId });
    res.json({ isFollowing: !!follow });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const hostId = req.params.hostId || req.user._id;
    const follows = await Follow.find({ following: hostId })
      .populate('follower', 'firstName lastName profileImage')
      .sort({ createdAt: -1 });
    res.json(follows.map((f) => f.follower));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
