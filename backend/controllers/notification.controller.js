const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const Customer = require('../models/customer.model');
const BusinessOwner = require('../models/businessOwner.model');

// Get user notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const filter = { userId };
    if (unreadOnly === 'true') {
      filter.read = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('data.transactionId', 'amount status')
      .populate('data.businessId', 'name')
      .populate('data.reviewId', 'rating comment');

    const totalNotifications = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalNotifications / limit),
        totalNotifications,
        hasMore: page * limit < totalNotifications
      },
      unreadCount
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Mark all notifications as read
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    await Notification.updateMany(
      { userId, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const unreadCount = await Notification.countDocuments({ userId, read: false });
    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Helper function to create notifications
exports.createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    throw err;
  }
};

// Helper function to create order-related notifications
exports.createOrderNotification = async (transaction, type, io = null) => {
  try {
    let notifications = [];

    switch (type) {
      case 'order_placed':
        // Notify business owner about new order
        if (transaction.businessId && transaction.businessId.ownerId) {
          const businessOwner = await BusinessOwner.findById(transaction.businessId.ownerId).populate('userId');
          if (businessOwner) {
            const notification = await exports.createNotification({
              userId: businessOwner.userId._id,
              type: 'order_placed',
              title: 'New Order Received',
              message: `You received a new order for ${transaction.sellableId?.title || 'an item'} from ${transaction.customerId?.userId?.name || 'a customer'}`,
              data: {
                transactionId: transaction._id,
                businessId: transaction.businessId._id,
                amount: transaction.amount,
                customerName: transaction.customerId?.userId?.name
              },
              actionUrl: `/dashboard/orders/${transaction._id}`
            });
            notifications.push(notification);

            // Emit real-time notification
            if (global.io) {
              global.global.io.to(`user_${businessOwner.userId._id}`).emit('newNotification', notification);
              console.log(`Order notification sent to business owner ${businessOwner.userId._id} for transaction ${transaction._id}`);
            } else {
              console.log('Global io not available for notification');
            }
          }
        }
        break;

      case 'order_confirmed':
      case 'order_completed':
      case 'order_cancelled':
        // Notify customer about order status change
        if (transaction.customerId && transaction.customerId.userId) {
          const statusMessages = {
            order_confirmed: 'Your order has been confirmed',
            order_completed: 'Your order has been completed',
            order_cancelled: 'Your order has been cancelled'
          };

          const notification = await exports.createNotification({
            userId: transaction.customerId.userId._id,
            type,
            title: statusMessages[type],
            message: `Your order for ${transaction.sellableId?.title || 'an item'} from ${transaction.businessId?.name || 'the business'} has been ${type.split('_')[1]}`,
            data: {
              transactionId: transaction._id,
              businessId: transaction.businessId._id,
              amount: transaction.amount,
              businessName: transaction.businessId?.name
            },
            actionUrl: `/orders/${transaction._id}`
          });
          notifications.push(notification);

          // Emit real-time notification
          if (global.io) {
            global.global.io.to(`user_${transaction.customerId.userId._id}`).emit('newNotification', notification);
            console.log(`Order status notification sent to customer ${transaction.customerId.userId._id} for transaction ${transaction._id}`);
          } else {
            console.log('Global io not available for notification');
          }
        }
        break;
    }

    return notifications;
  } catch (err) {
    console.error('Error creating order notification:', err);
    throw err;
  }
};

// Helper function to create review notifications
exports.createReviewNotification = async (review, io = null) => {
  try {
    // Notify business owner about new review
    const Business = require('../models/business.model');
    const business = await Business.findById(review.businessId).populate({
      path: 'ownerId',
      populate: { path: 'userId' }
    });

    if (business && business.ownerId) {
      const notification = await exports.createNotification({
        userId: business.ownerId.userId._id,
        type: 'review_received',
        title: 'New Review Received',
        message: `You received a ${review.rating}-star review for ${business.name}`,
        data: {
          businessId: business._id,
          reviewId: review._id,
          businessName: business.name
        },
        actionUrl: `/manage/business/${business._id}#reviews`
      });

      // Emit real-time notification
      if (global.io) {
        global.global.io.to(`user_${business.ownerId.userId._id}`).emit('newNotification', notification);
      }

      return notification;
    }
  } catch (err) {
    console.error('Error creating review notification:', err);
    throw err;
  }
};

// Helper function to create verification notifications
exports.createVerificationNotification = async (businessId, status, adminNotes = '', io = null) => {
  try {
    const Business = require('../models/business.model');
    const business = await Business.findById(businessId).populate({
      path: 'ownerId',
      populate: { path: 'userId' }
    });

    if (business && business.ownerId) {
      const notification = await exports.createNotification({
        userId: business.ownerId.userId._id,
        type: status === 'approved' ? 'business_verified' : 'verification_rejected',
        title: status === 'approved' ? 'Business Verified!' : 'Verification Rejected',
        message: status === 'approved' 
          ? `Your business "${business.name}" has been verified!`
          : `Your business verification for "${business.name}" was rejected. ${adminNotes}`,
        data: {
          businessId: business._id,
          businessName: business.name
        },
        actionUrl: `/manage/business/${business._id}`
      });

      // Emit real-time notification
      if (global.io) {
        global.global.io.to(`user_${business.ownerId.userId._id}`).emit('newNotification', notification);
      }

      return notification;
    }
  } catch (err) {
    console.error('Error creating verification notification:', err);
    throw err;
  }
};

// Helper function to create business visit notifications
exports.createBusinessVisitNotification = async (businessId, visitorData) => {
  try {
    const Business = require('../models/business.model');
    const business = await Business.findById(businessId).populate({
      path: 'ownerId',
      populate: { path: 'userId' }
    });

    if (business && business.ownerId) {
      // Don't notify if the visitor is the business owner themselves
      if (business.ownerId.userId._id.toString() === visitorData.userId.toString()) {
        return null;
      }

      // Check if there's already a recent visit notification from this user (within last hour)
      const recentNotification = await Notification.findOne({
        userId: business.ownerId.userId._id,
        type: 'business_visited',
        'data.visitorId': visitorData.userId,
        'data.businessId': businessId,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
      });

      if (recentNotification) {
        return null; // Don't spam with visit notifications
      }

      const notification = await exports.createNotification({
        userId: business.ownerId.userId._id,
        type: 'business_visited',
        title: 'Business Page Visit',
        message: `${visitorData.customerName} visited your business page "${business.name}"`,
        data: {
          businessId: business._id,
          businessName: business.name,
          visitorId: visitorData.userId,
          customerName: visitorData.customerName
        },
        actionUrl: `/view/business/${business._id}`
      });

      // Emit real-time notification
      if (global.io) {
        global.io.to(`user_${business.ownerId.userId._id}`).emit('newNotification', notification);
      }

      return notification;
    }
  } catch (err) {
    console.error('Error creating business visit notification:', err);
    throw err;
  }
};

// Helper function to create upcoming order notifications
exports.createUpcomingOrderNotification = async (businessId, customerData, io = null) => {
  try {
    const Business = require('../models/business.model');
    const business = await Business.findById(businessId).populate({
      path: 'ownerId',
      populate: { path: 'userId' }
    });

    if (business && business.ownerId) {
      // Don't notify if the customer is the business owner themselves
      if (business.ownerId.userId._id.toString() === customerData.userId.toString()) {
        return null;
      }

      const notification = await exports.createNotification({
        userId: business.ownerId.userId._id,
        type: 'upcoming_order',
        title: 'Potential Customer Interest',
        message: `${customerData.customerName} is showing interest in your business "${business.name}". They might place an order soon!`,
        data: {
          businessId: business._id,
          businessName: business.name,
          customerId: customerData.userId,
          customerName: customerData.customerName
        },
        actionUrl: `/view/business/${business._id}`
      });

      // Emit real-time notification
      if (global.io) {
        global.io.to(`user_${business.ownerId.userId._id}`).emit('newNotification', notification);
      }

      return notification;
    }
  } catch (err) {
    console.error('Error creating upcoming order notification:', err);
    throw err;
  }
};
