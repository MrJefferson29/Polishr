const HostApplication = require('../models/HostApplication');
const User = require('../models/user');
const Salon = require('../models/salon');
const NotificationService = require('../services/notificationService');

const buildAddress = (body) => ({
  street: String(body.street || '').trim(),
  city: String(body.city || '').trim(),
  state: String(body.state || '').trim(),
  postalCode: String(body.postalCode || '').trim(),
  country: String(body.country || 'Cameroon').trim(),
});

const syncSalonAddressFromPostal = (postalAddress) => ({
  street: postalAddress.street,
  city: postalAddress.city,
  state: postalAddress.state,
  postalCode: postalAddress.postalCode || '',
  country: postalAddress.country || 'Cameroon',
});

const parseServicesInput = (body) => {
  let raw = body.services;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && s.name && String(s.name).trim())
    .map((s) => ({
      catalogId: s.catalogId || undefined,
      name: String(s.name).trim(),
      category: s.category || 'other',
      duration: parseInt(s.duration, 10) || 45,
      price: parseFloat(s.price) || 0,
      isActive: s.isActive !== false,
      description: s.description || '',
    }));
};

exports.submitApplication = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const existingApplication = await HostApplication.findOne({
      user: req.user._id,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You already have a pending or approved application' });
    }

    const requiredFields = [
      'firstName', 'lastName', 'email', 'phoneNumber',
      'street', 'city', 'state',
      'salonName', 'salonDescription',
    ];

    const missingFields = requiredFields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || String(value).trim() === '';
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    const postalAddress = buildAddress(req.body);
    const salonAddress = syncSalonAddressFromPostal(postalAddress);

    const lat = req.body.lat != null && req.body.lat !== '' ? parseFloat(req.body.lat) : undefined;
    const lng = req.body.lng != null && req.body.lng !== '' ? parseFloat(req.body.lng) : undefined;

    const services = parseServicesInput(req.body);
    if (!services.length) {
      return res.status(400).json({ message: 'Select at least one service with pricing.' });
    }

    const application = await HostApplication.create({
      user: req.user._id,
      firstName: req.body.firstName.trim(),
      lastName: req.body.lastName.trim(),
      email: req.body.email.trim(),
      phoneNumber: req.body.phoneNumber.trim(),
      postalAddress,
      salonAddress,
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
      salonName: req.body.salonName.trim(),
      salonDescription: req.body.salonDescription.trim(),
      numberOfEmployees: parseInt(req.body.numberOfEmployees, 10) || 1,
      yearsOfExperience: parseInt(req.body.yearsOfExperience, 10) || 0,
      services,
      status: 'pending',
      submittedAt: new Date(),
    });

    try {
      if (NotificationService.createNotification) {
        await NotificationService.createNotification(
          req.user._id,
          'Host Application Submitted',
          'Your host application has been submitted. An admin will review it shortly.',
          '/host-application-status',
          'info'
        );
      }
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    res.status(201).json({
      message: 'Host application submitted successfully. An admin will review your application shortly.',
      application,
    });
  } catch (err) {
    console.error('Error in submitApplication:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error submitting application', error: err.message });
    }
  }
};

exports.getMyApplication = async (req, res) => {
  try {
    const application = await HostApplication.findOne({ user: req.user._id });
    if (!application) return res.status(404).json({ message: 'No application found' });
    res.json(application);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.listApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const applications = await HostApplication.find(query).populate('user', 'firstName lastName email role');
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const defaultSalonServices = () => [
  { name: 'Classic Manicure', category: 'manicure', duration: 45, price: 3500, isActive: true },
  { name: 'Classic Pedicure', category: 'pedicure', duration: 60, price: 4500, isActive: true },
];

exports.approveApplication = async (req, res) => {
  try {
    const adminNote = (req.body.adminNote || req.body.note || '').trim() || 'Approved by admin';

    const application = await HostApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.status === 'approved') {
      return res.status(400).json({ message: 'This application is already approved' });
    }
    if (application.status === 'declined') {
      return res.status(400).json({ message: 'Cannot approve a declined application' });
    }

    application.status = 'approved';
    application.reviewedAt = new Date();
    application.reviewedBy = req.user._id;
    application.adminNote = adminNote;
    await application.save();

    const addr = application.postalAddress || application.salonAddress;

    await User.findByIdAndUpdate(application.user, {
      firstName: application.firstName,
      lastName: application.lastName,
      email: application.email,
      phoneNumber: application.phoneNumber,
      role: 'host',
      hostProfile: {
        phoneNumber: application.phoneNumber,
        yearsOfExperience: application.yearsOfExperience ?? 0,
        businessAddress: addr,
        applicationApprovedAt: new Date(),
        applicationApprovedBy: req.user._id,
      },
    });

    const salonPayload = {
      name: application.salonName,
      description: application.salonDescription,
      address: addr?.street || '',
      city: addr?.city || '',
      state: addr?.state || '',
      country: addr?.country || 'Cameroon',
      postalCode: addr?.postalCode || '',
      numberOfEmployees: application.numberOfEmployees || 1,
      phone: application.phoneNumber,
      email: application.email,
      lat: application.lat ?? 0,
      lng: application.lng ?? 0,
    };

    const salonServices =
      application.services?.length > 0 ? application.services : defaultSalonServices();

    let salon = await Salon.findOne({ owner: application.user });
    if (salon) {
      Object.assign(salon, salonPayload);
      salon.services = salonServices;
      await salon.save();
    } else {
      salon = await Salon.create({
        owner: application.user,
        ...salonPayload,
        services: salonServices,
      });
    }

    try {
      await NotificationService.createHostApplicationNotification(application._id, 'host_application_approved');
    } catch (notificationError) {
      console.error('Approval notification error:', notificationError);
    }

    res.json({
      message: 'Application approved successfully',
      application,
      salon,
    });
  } catch (err) {
    console.error('Error in approveApplication:', err);
    res.status(500).json({ message: 'Error approving application', error: err.message });
  }
};

exports.declineApplication = async (req, res) => {
  try {
    const application = await HostApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.status === 'declined') {
      return res.status(400).json({ message: 'Already declined' });
    }

    application.status = 'declined';
    application.reviewedAt = new Date();
    application.reviewedBy = req.user._id;
    application.adminNote = req.body.adminNote?.adminNote || req.body.adminNote || '';
    await application.save();

    try {
      await NotificationService.createHostApplicationNotification(application._id, 'host_application_declined');
    } catch (notificationError) {
      console.error('Decline notification error:', notificationError);
    }

    res.json({ message: 'Application declined', application });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
