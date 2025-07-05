const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const connectDB = require('../config/db.config');

const User = require('../models/user.model');
const BusinessOwner = require('../models/businessOwner.model');
const Customer = require('../models/customer.model');
const Business = require('../models/business.model');
const Sellable = require('../models/sellable.model');
const Category = require('../models/category.model');
const Location = require('../models/location.model');
const SavedBusiness = require('../models/savedBusiness.model');
const Review = require('../models/review.model');
const Transaction = require('../models/transaction.model');
const Dispute = require('../models/dispute.model');
const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const VerificationRequest = require('../models/verificationRequest.model');
const CustomerVerification = require('../models/customerVerification.model');

dotenv.config();

async function seed() {
  try {
    // Check if data already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Database already seeded, skipping...');
      return;
    }

    console.log('Seeding database...');

    // Clear existing data in proper order (delete dependent models first)
    await Promise.all([
      Message.deleteMany({}),
      Conversation.deleteMany({}),
      Dispute.deleteMany({}),
      Transaction.deleteMany({}),
      Review.deleteMany({}),
      SavedBusiness.deleteMany({}),
      CustomerVerification.deleteMany({}),
      VerificationRequest.deleteMany({}),
    ]);

    await Promise.all([
      Sellable.deleteMany({}),
      Business.deleteMany({}),
    ]);

    await Promise.all([
      BusinessOwner.deleteMany({}),
      Customer.deleteMany({}),
      User.deleteMany({}),
    ]);

    await Promise.all([
      Category.deleteMany({}),
      Location.deleteMany({}),
    ]);

    // Base lookup data
    const [foodCategory, techCategory] = await Category.create([
      { name: 'Food' },
      { name: 'Technology' },
    ]);

    const [manila, cebu] = await Location.create([
      { name: 'Metro Manila' },
      { name: 'Cebu' },
    ]);

    // Admin user
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('adminpass', 10),
      role: 'admin',
    });

    // Owner user and business
    const ownerUser = await User.create({
      name: 'Owner',
      email: 'owner@example.com',
      password: await bcrypt.hash('ownerpass', 10),
      role: 'owner',
    });
    const owner = await BusinessOwner.create({ userId: ownerUser._id, verified: true });
    const business = await Business.create({
      name: 'Trompo Bistro',
      description: 'Authentic tacos and more',
      ownerId: owner._id,
      categoryId: foodCategory._id,
      locationId: manila._id,
      isVerified: true,
    });

    await VerificationRequest.create({
      ownerId: owner._id,
      documents: ['permit.pdf'],
      status: 'approved',
    });

    const product = await Sellable.create({
      businessId: business._id,
      title: 'Trompo Taco',
      description: 'Delicious pork taco',
      type: 'product',
      price: 3,
      inventory: 100,
    });

    await Sellable.create({
      businessId: business._id,
      title: 'Catering Service',
      description: 'On-site taco stand',
      type: 'service',
      price: 150,
    });

    // Customer user
    const customerUser = await User.create({
      name: 'Customer',
      email: 'customer@example.com',
      password: await bcrypt.hash('customerpass', 10),
      role: 'customer',
    });
    const customer = await Customer.create({ userId: customerUser._id, address: '123 Street', phone: '555-0101' });

    await CustomerVerification.create({
      customerId: customer._id,
      documents: ['id.png'],
      status: 'approved',
      adminNotes: 'Looks good',
    });

    await SavedBusiness.create({ customerId: customer._id, businessId: business._id });

    await Review.create({
      customerId: customer._id,
      businessId: business._id,
      rating: 5,
      comment: 'Amazing tacos!',
    });

    const transaction = await Transaction.create({
      customerId: customer._id,
      businessId: business._id,
      sellableId: product._id,
      amount: 3,
      status: 'completed',
      paymentMethod: 'cash',
    });

    await Dispute.create({
      transactionId: transaction._id,
      reason: 'Wrong item delivered',
      status: 'resolved',
      adminNotes: 'Refund issued',
    });

    const conversation = await Conversation.create({
      participants: [ownerUser._id, customerUser._id],
    });

    await Message.create([
      { conversationId: conversation._id, senderId: ownerUser._id, text: 'Hello! How can I help you?' },
      { conversationId: conversation._id, senderId: customerUser._id, text: 'I want to book catering.' },
    ]);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Seeding error:', error);
    // Don't throw error to prevent server from crashing
    console.log('Continuing without seeding...');
  }
}

module.exports = seed;
