//importing express and routes
const express = require('express');
const authController = require('./../../controllers/authController');
const paymentController = require('./../../controllers/paymentController')

//creating route
const router = express.Router()

//defining routes for checkout
router.post('/checkout',authController.userAuthorization, paymentController.checkout)
router.post('/paymentVerification',authController.userAuthorization, paymentController.paymentVerification)

module.exports = router