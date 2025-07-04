const Customer = require('../models/customer.model');
const SavedBusiness = require('../models/savedBusiness.model');
const CustomerVerification = require('../models/customerVerification.model');

exports.submitVerification = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const customer = await Customer.findOne({ userId: req.user.userId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const { documents } = req.body;
    const verification = new CustomerVerification({ customerId: customer._id, documents });
    await verification.save();
    res.status(201).json({ message: 'Verification submitted', verification });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getSavedBusinesses = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const customer = await Customer.findOne({ userId: req.user.userId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const saved = await SavedBusiness.find({ customerId: customer._id }).populate('businessId');
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
