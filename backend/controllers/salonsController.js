const Salon = require('../models/salon');
const Review = require('../models/review');
const cloudinary = require('cloudinary').v2;
const NotificationService = require('../services/notificationService');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadImages = async (files, folder) => {
  const urls = [];
  if (!files || !files.length) return urls;
  for (const file of files) {
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(base64, {
      folder: `salon-${folder}`,
      resource_type: 'auto',
    });
    urls.push(result.secure_url);
  }
  return urls;
};

const parseJsonField = (val, fallback) => {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
};

exports.getAllSalons = async (req, res) => {
  try {
    const { owner, city, search } = req.query;
    const query = { isActive: true, 'deactivationInfo.isDeactivated': { $ne: true } };
    if (owner) query.owner = owner;
    if (city) query.city = new RegExp(city, 'i');
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { title: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
      ];
    }

    const salons = await Salon.find(query).populate('owner', 'firstName lastName email profileImage');
    const salonIds = salons.map((s) => s._id);
    const reviewStats = await Review.getAverageRatingsForSalons(salonIds);

    const result = salons.map((salon, i) => ({
      ...salon.toObject(),
      rating: reviewStats[i].averageRating,
      reviews: reviewStats[i].totalReviews,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getSalonById = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id).populate(
      'owner',
      'firstName lastName email profileImage role followerCount'
    );
    if (!salon) return res.status(404).json({ message: 'Salon not found' });

    const stats = await Review.getAverageRating(salon._id);
    res.json({
      ...salon.toObject(),
      rating: stats.averageRating,
      reviews: stats.totalReviews,
      detailedRatings: stats,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMySalon = async (req, res) => {
  try {
    const salon = await Salon.findOne({ owner: req.user._id });
    if (!salon) return res.status(404).json({ message: 'No salon found for this host' });
    res.json(salon);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createSalon = async (req, res) => {
  try {
    if (req.user.role !== 'host' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only hosts can create a salon profile' });
    }

    const existing = await Salon.findOne({ owner: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You already have a salon profile' });
    }

    const placeFiles = req.files?.placeImages || [];
    const workFiles = req.files?.workImages || [];
    const placeImages = await uploadImages(placeFiles, 'place');
    const workImages = await uploadImages(workFiles, 'work');

    const services = parseJsonField(req.body.services, []);
    const openingHours = parseJsonField(req.body.openingHours, {});
    const amenities = parseJsonField(req.body.amenities, []);

    const salon = await Salon.create({
      owner: req.user._id,
      name: req.body.name,
      title: req.body.title || '',
      description: req.body.description,
      placeImages,
      workImages,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      postalCode: req.body.postalCode,
      lat: parseFloat(req.body.lat) || 0,
      lng: parseFloat(req.body.lng) || 0,
      phone: req.body.phone || '',
      email: req.body.email || req.user.email,
      website: req.body.website || '',
      numberOfEmployees: parseInt(req.body.numberOfEmployees, 10) || 1,
      openingHours,
      services,
      amenities,
      cancellationPolicy: req.body.cancellationPolicy || '24 hours before appointment',
    });

    await NotificationService.createSalonNotification(salon._id, 'salon_created');
    res.status(201).json(salon);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateSalon = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);
    if (!salon) return res.status(404).json({ message: 'Salon not found' });
    if (salon.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const placeFiles = req.files?.placeImages || [];
    const workFiles = req.files?.workImages || [];

    if (req.body.existingPlaceImages !== undefined) {
      salon.placeImages = parseJsonField(req.body.existingPlaceImages, []);
    }
    if (req.body.existingWorkImages !== undefined) {
      salon.workImages = parseJsonField(req.body.existingWorkImages, []);
    }
    if (placeFiles.length) {
      salon.placeImages = [...(salon.placeImages || []), ...(await uploadImages(placeFiles, 'place'))];
    }
    if (workFiles.length) {
      salon.workImages = [...(salon.workImages || []), ...(await uploadImages(workFiles, 'work'))];
    }

    const fields = [
      'name', 'title', 'description', 'address', 'city', 'state', 'country',
      'postalCode', 'phone', 'email', 'website', 'numberOfEmployees', 'cancellationPolicy',
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) salon[f] = req.body[f];
    });
    if (req.body.lat != null) salon.lat = parseFloat(req.body.lat);
    if (req.body.lng != null) salon.lng = parseFloat(req.body.lng);
    if (req.body.services) salon.services = parseJsonField(req.body.services, salon.services);
    if (req.body.openingHours) salon.openingHours = parseJsonField(req.body.openingHours, salon.openingHours);
    if (req.body.amenities) salon.amenities = parseJsonField(req.body.amenities, salon.amenities);

    await salon.save();
    await NotificationService.createSalonNotification(salon._id, 'salon_updated');
    res.json(salon);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deactivateSalon = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.salonId);
    if (!salon) return res.status(404).json({ message: 'Salon not found' });
    if (salon.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    salon.deactivationInfo = {
      isDeactivated: true,
      deactivatedAt: new Date(),
      deactivatedUntil: req.body.deactivatedUntil || null,
      deactivationReason: req.body.reason || '',
    };
    salon.isActive = false;
    await salon.save();
    res.json(salon);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.activateSalon = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.salonId);
    if (!salon) return res.status(404).json({ message: 'Salon not found' });
    if (salon.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    salon.deactivationInfo = { isDeactivated: false };
    salon.isActive = true;
    await salon.save();
    res.json(salon);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getPopularSalons = async (req, res) => {
  try {
    const salons = await Salon.find({ isActive: true, 'deactivationInfo.isDeactivated': { $ne: true } })
      .sort({ appointmentCount: -1 })
      .limit(10)
      .populate('owner', 'firstName lastName profileImage');
    const salonIds = salons.map((s) => s._id);
    const reviewStats = await Review.getAverageRatingsForSalons(salonIds);
    const result = salons.map((salon, i) => ({
      ...salon.toObject(),
      rating: reviewStats[i].averageRating,
      reviews: reviewStats[i].totalReviews,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

exports.getNearbySalons = async (req, res) => {
  try {
    const { lat, lng, radius = 60 } = req.query;
    if (!lat || !lng) return res.status(400).json({ message: 'lat and lng required' });

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxKm = parseFloat(radius);

    const salons = await Salon.find({
      isActive: true,
      'deactivationInfo.isDeactivated': { $ne: true },
      lat: { $exists: true, $ne: null, $ne: 0 },
      lng: { $exists: true, $ne: null, $ne: 0 },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [userLng, userLat] },
          $maxDistance: maxKm * 1000,
        },
      },
    })
      .populate('owner', 'firstName lastName profileImage')
      .limit(40);

    const salonIds = salons.map((s) => s._id);
    const reviewStats = await Review.getAverageRatingsForSalons(salonIds);

    const result = salons
      .map((salon, i) => {
        const distanceKm = haversineKm(userLat, userLng, salon.lat, salon.lng);
        return {
          ...salon.toObject(),
          rating: reviewStats[i]?.averageRating ?? salon.averageRating ?? 0,
          reviews: reviewStats[i]?.totalReviews ?? salon.totalReviews ?? 0,
          distanceKm: Number(distanceKm.toFixed(1)),
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
