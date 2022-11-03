//importing mongoose
const mongoose = require('mongoose');

//booking schema
const bookingSchema = new mongoose.Schema({
  transactionID: {
    type: String,
    required: [true, 'Trasaction ID is required'],
  },
  rentalID: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'Rental',
    required: [true, 'Rental ID is required'],
  },
  userID: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  isStayCompleted: {
    type: Boolean,
    default: false,
  },
  isCancelled: {
    type: Boolean,
    default: false,
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  bookingDate: {
    type: Date,
    required: [true, 'Booking date is required'],
    default: () => Date.now(),
  },
  userEmail: {
    type: String,
    required: [true, 'Username is required'],
  },
  ownerId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: [true, 'Owner ID is required'],
  },
  bookingCost: {
    type: Number,
    required: [true, 'Enter the price for the booking'],
  },
});

bookingSchema.index({ rentalID: 1, ownerId: 1, userID: 1 });

Bookings = mongoose.model('Bookings', bookingSchema);

module.exports = Bookings;
