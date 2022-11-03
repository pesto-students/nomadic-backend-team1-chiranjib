//importing express and routes
const express = require('express')
const wishlistController = require('./../../controllers/wishlistController')
const authController = require('./../../controllers/authController');

//creating route
const router =  express.Router()

//defining methods
router.get('/getWishlist/:id',authController.userAuthorization, wishlistController.getAllWishlist)
router.get('/getWishlistData/:id',authController.userAuthorization, wishlistController.getAllWishlistData)
router.post('/addwishlist',authController.userAuthorization, wishlistController.addToWishlist)
router.delete('/deleteWishlist/:id',authController.userAuthorization, wishlistController.deleteFromWishlist)




module.exports = router