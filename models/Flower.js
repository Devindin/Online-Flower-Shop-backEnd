const mongoose = require('mongoose');

const flowerSchema = new mongoose.Schema({
  title: String,
  price: String,
  image: String,
  category: String,
  description: String
});

module.exports = mongoose.model('Flower', flowerSchema);
