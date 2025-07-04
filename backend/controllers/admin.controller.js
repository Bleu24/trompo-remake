const CustomerVerification = require('../models/customerVerification.model');
const VerificationRequest = require('../models/verificationRequest.model');
const Review = require('../models/review.model');

function checkAdmin(req, res) {
  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Not authorized' });
    return false;
  }
  return true;
}

// ---- Customer Verifications ----

exports.getCustomerVerifications = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const verifications = await CustomerVerification.find().populate('customerId');
    res.json(verifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getCustomerVerification = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const verification = await CustomerVerification.findById(req.params.id).populate('customerId');
    if (!verification) return res.status(404).json({ message: 'Not found' });
    res.json(verification);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateCustomerVerification = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const verification = await CustomerVerification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!verification) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated', verification });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteCustomerVerification = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const verification = await CustomerVerification.findByIdAndDelete(req.params.id);
    if (!verification) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- Business Verifications ----

exports.getBusinessVerifications = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const requests = await VerificationRequest.find().populate('ownerId');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getBusinessVerification = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const request = await VerificationRequest.findById(req.params.id).populate('ownerId');
    if (!request) return res.status(404).json({ message: 'Not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateBusinessVerification = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const request = await VerificationRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated', request });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteBusinessVerification = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const request = await VerificationRequest.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getReviews = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const reviews = await Review.find().populate('customerId').populate('businessId');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getReview = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const review = await Review.findById(req.params.id).populate('customerId').populate('businessId');
    if (!review) return res.status(404).json({ message: 'Not found' });
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateReview = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!review) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated', review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
