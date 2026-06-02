const Notification = require('../models/notification');
const Appointment = require('../models/appointment');
const Salon = require('../models/salon');
const HostApplication = require('../models/HostApplication');
const Follow = require('../models/follow');
const Post = require('../models/post');
const User = require('../models/user');

class NotificationService {
  static async createNotification(data) {
    const notification = new Notification(data);
    await notification.save();
    return notification;
  }

  static async createAppointmentNotification(appointmentId, type = 'appointment') {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('salon', 'name')
        .populate('user', 'firstName lastName');

      if (!appointment) return;

      const salonName = appointment.salon?.name || 'salon';
      const guestName = `${appointment.user.firstName} ${appointment.user.lastName}`;

      const titles = {
        appointment: 'New Appointment',
        appointment_confirmed: 'Appointment Confirmed',
        appointment_cancelled: 'Appointment Cancelled',
      };

      const title = titles[type] || 'Appointment Update';

      await this.createNotification({
        user: appointment.user._id,
        type,
        title,
        message: `Your appointment at ${salonName} has been updated.`,
        appointment: appointmentId,
        salon: appointment.salon._id,
      });

      await this.createNotification({
        user: appointment.host,
        type,
        title: type === 'appointment' ? 'New Appointment Request' : title,
        message: `${guestName} booked an appointment at ${salonName}.`,
        appointment: appointmentId,
        salon: appointment.salon._id,
        relatedUser: appointment.user._id,
      });
    } catch (err) {
      console.error('Appointment notification error:', err);
    }
  }

  static async createSalonNotification(salonId, type = 'salon_created') {
    try {
      const salon = await Salon.findById(salonId);
      if (!salon) return;
      const titles = {
        salon_created: 'Salon Profile Created',
        salon_updated: 'Salon Profile Updated',
      };
      await this.createNotification({
        user: salon.owner,
        type,
        title: titles[type] || 'Salon Update',
        message: `Your salon "${salon.name}" profile has been ${type === 'salon_created' ? 'created' : 'updated'}.`,
        salon: salonId,
      });
    } catch (err) {
      console.error('Salon notification error:', err);
    }
  }

  static async createHostApplicationNotification(applicationId, type = 'host_application') {
    try {
      const application = await HostApplication.findById(applicationId).populate('user', 'firstName lastName email');
      if (!application) return;

      const messages = {
        host_application: 'Your host application has been submitted.',
        host_application_approved: 'Congratulations! Your host application has been approved.',
        host_application_declined: 'Your host application was declined.',
      };

      await this.createNotification({
        user: application.user._id,
        type,
        title: type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        message: messages[type] || 'Host application update',
        hostApplication: applicationId,
      });
    } catch (err) {
      console.error('Host application notification error:', err);
    }
  }

  static async createFollowNotification(hostId, followerId) {
    try {
      const follower = await User.findById(followerId).select('firstName lastName');
      if (!follower) return;
      await this.createNotification({
        user: hostId,
        type: 'follow',
        title: 'New Follower',
        message: `${follower.firstName} ${follower.lastName} started following you.`,
        relatedUser: followerId,
      });
    } catch (err) {
      console.error('Follow notification error:', err);
    }
  }

  static async createPostNotification(postId) {
    try {
      const post = await Post.findById(postId).populate('author', 'firstName lastName');
      if (!post) return;

      const followers = await Follow.find({ following: post.author._id }).select('follower');
      for (const f of followers) {
        await this.createNotification({
          user: f.follower,
          type: 'post',
          title: 'New Post',
          message: `${post.author.firstName} ${post.author.lastName} shared a new post.`,
          post: postId,
          relatedUser: post.author._id,
          salon: post.salon,
        });
      }
    } catch (err) {
      console.error('Post notification error:', err);
    }
  }

  static async createReviewNotification(reviewId, hostId, guestId) {
    try {
      await this.createNotification({
        user: hostId,
        type: 'review_received',
        title: 'New Review',
        message: 'You received a new review on your salon.',
        review: reviewId,
        relatedUser: guestId,
      });
    } catch (err) {
      console.error('Review notification error:', err);
    }
  }

  static async createWelcomeNotification(userId) {
    await this.createNotification({
      user: userId,
      type: 'welcome',
      title: 'Welcome to NailBook',
      message: 'Discover nail salons, book appointments, and follow your favorite techs.',
    });
  }

  // Legacy aliases
  static async createBookingNotification(id, type) {
    return this.createAppointmentNotification(id, type?.replace('booking', 'appointment') || 'appointment');
  }

  static async createListingNotification(id, type) {
    const mapped = type?.replace('listing', 'salon') || 'salon_created';
    return this.createSalonNotification(id, mapped);
  }

  static async createLikeNotification() {
    // Deprecated: likes replaced by follows
  }

  static async markAsRead(notificationId) {
    return Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
  }

  static async markAllAsRead(userId) {
    return Notification.updateMany({ user: userId }, { read: true });
  }

  static async getUnreadCount(userId) {
    return Notification.countDocuments({ user: userId, read: false });
  }
}

module.exports = NotificationService;
