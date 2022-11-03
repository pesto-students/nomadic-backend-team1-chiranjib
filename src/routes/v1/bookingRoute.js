//importing express and routes
const express = require('express');
const authController = require('./../../controllers/authController');
const bookingController = require('./../../controllers/bookingController')

//creating route
const router = express.Router();

//defining methods for booking 
router.get('/getBlockDate/:id', bookingController.getBlockedDates );
router.get('/getAllBookingAdmin/:id',authController.userAuthorization, bookingController.getAllBookingsAdmin );
router.get('/getAllBookingUser/:id',authController.userAuthorization, bookingController.getAllBookingsUser );
router.post('/bookARental',authController.userAuthorization, bookingController.bookaRental );
router.patch('/cancelBooking/:id',authController.userAuthorization, bookingController.cancelBooking );


module.exports = router;
