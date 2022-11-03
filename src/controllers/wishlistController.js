const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Wishlist = require('./../model/wishlistModel');
const Logger = require('../utils/logger')

exports.getAllWishlist = catchAsync(async (req, res, next) => {
  const allWishlist = await Wishlist.find({ userId: req.params.id });

  if (!allWishlist) {
    Logger.ServiceLogger.log('info',`No wishlist is found`)
    return new AppError('No wishlist found', 400);
  }
  Logger.ServiceLogger.log('info',`All wishlist is fetched and sent successfully for userID:${req.userId}`)
  res.status(200).json({
    status: 'success',
    data: {
      allWishlist,
    },
  });
});
exports.getAllWishlistData = catchAsync(async (req, res, next) => {
  const allWishlist = await Wishlist.find({ userId: req.params.id }).populate({
    path: 'rentalId',
    select: ['rentalName', 'subDestination', 'price', 'state', 'originalImages', 'noOfPeopleAccomodate'],
  });

  if (!allWishlist) {
    Logger.ServiceLogger.log('info',`No wishlist found`)
    return new AppError('No wishlist found', 400);
  }
  Logger.ServiceLogger.log('info',`All wishlist data is fetched for user ID:${req.params.id} and response is sent`)
  res.status(200).json({
    status: 'success',
    data: {
      allWishlist,
    },
  });
});

exports.addToWishlist = catchAsync(async (req, res, next) => {
  const wishlist = await Wishlist.create({
    userId: req.body.userId,
    rentalId: req.body.rentalId,
  });

  if (!wishlist) {
    Logger.ServiceLogger.log('info',`Error creating a wishlist`)
    return new AppError('Error creating a wishlist', 400);
  }

  Logger.ServiceLogger.log('info',`rental ${req.body.rentalId} added to user: ${req.body.userId} wishlist`)
  res.status(201).json({
    status: 'success',
    data: {
      wishlist,
    },
  });
});

exports.deleteFromWishlist = catchAsync(async (req, res, next) => {
  const wishlist = await Wishlist.findOneAndDelete({ _id: req.params.id });

  if (!wishlist) {
    Logger.ServiceLogger.log('info',`rental is not found for given wishlist ID`)
    return new AppError('Something went wrong trouble removing the wishlist', 400);
  }

  Logger.ServiceLogger.log('info',`wishlist${req.params.id} is removed `)
  res.status(204).json({
    status: 'success',
    data: {
      wishlist,
    },
  });
});
