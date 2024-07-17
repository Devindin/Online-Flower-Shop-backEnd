const mongoose =require('mongoose');
const bcrypt = require('bcrypt');

const orderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    required: true
  },
  deliveryDate: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  cart: {
    type: Array,
    required: true
  },
  delivered: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Order', orderSchema);
