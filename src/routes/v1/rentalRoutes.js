//importing express and routes
const express = require('express');
const authController = require('./../../controllers/authController');
const rentalController = require('./../../controllers/rentalController');

//creating route
const router = express.Router();

//defining methods
router.post('/addRental',authController.userAuthorization, rentalController.addRental);
router.get('/',rentalController.getAllRental);
router.get('/search/',rentalController.searchForRental);
router.get('/:id', rentalController.getRentalById);
router.get('/owner/:id',authController.userAuthorization, rentalController.getRentalByOwner);
router.patch('/:id',authController.userAuthorization, rentalController.updateRental);

module.exports = router;
