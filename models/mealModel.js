const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A meal must have a name!']
  },
  rating: {
    type: Number,
    default: 3,
    min: 1,
    max: 5,
  },
  photo: String,
  price: {
    type: Number,
    required: [true, 'A meal must have a price!'],
  },
  shopEntries: Number,
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  ratingsAverage: Number,
})


// Meal model
const Meal = mongoose.model('Meal', mealSchema);

module.exports = Meal;