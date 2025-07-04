const Review = require('../models/review.model');
const Customer = require('../models/customer.model');

exports.createReview = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const customer = await Customer.findOne({ userId: req.user.userId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const { businessId, rating, comment } = req.body;
    const review = new Review({
      customerId: customer._id,
      businessId,
      rating,
      comment,
    });
    await review.save();
    res.status(201).json({ message: 'Review created', review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const customer = await Customer.findOne({ userId: req.user.userId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, customerId: customer._id },
      req.body,
      { new: true }
    );
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json({ message: 'Review updated', review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const customer = await Customer.findOne({ userId: req.user.userId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      customerId: customer._id,
    });
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getReviewsByBusiness = async (req, res) => {
  try {
    const businessId = req.params.id;
    const reviews = await Review.find({ businessId })
      .populate('customerId')
      .populate('businessId');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
