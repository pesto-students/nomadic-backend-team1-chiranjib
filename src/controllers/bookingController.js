const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Booking = require('./../model/bookingsModel');
const sendEmail = require('./../utils/email');
const User = require('./../model/userModel');
const Logger = require('../utils/logger')

exports.bookaRental = catchAsync(async (req, res, next) => {

  //check if past dates
  Logger.ServiceLogger.log('info',`Checking booking date is not from past for rental:${req.body.rentalID} `)
  if (new Date(+req.body.startDate) < new Date() || new Date(+req.body.endDate) < new Date()) {
    res.status(403).json({
      status: 'fail',
      message: "can't book past dates",
    });
    return;
  }
  Logger.ServiceLogger.log('info',`Checking for blocked dates for rental:${req.body.rentalID} `)
  // check if dates are allready booked
  const blockedDates = await Booking.find({
    rentalID: req.body.rentalID,
    isCancelled: false,
    $or: [
      {
        $and: [
          {
            startDate: { $gte: new Date(+req.body.startDate) },
          },
          {
            startDate: { $lte: new Date(+req.body.endDate) },
          },
        ],
      },

      {
        $and: [
          {
            endDate: { $gte: new Date(+req.body.startDate) },
          },
          {
            endDate: { $lte: new Date(+req.body.endDate) },
          },
        ],
      },
    ],
  }).select('startDate endDate');

  if (blockedDates && blockedDates.length > 0) {
    Logger.ServiceLogger.log('warn',`Booking date is occupied for rental:${req.body.rentalID} `)
    res.status(403).json({
      status: 'fail',
      message: 'date is allready occupied',
    });
    return;
  }


  const booking = await Booking.create({
    transactionID: req.body.transactionID,
    rentalID: req.body.rentalID,
    userID: req.body.userID,
    isStayCompleted: req.body.isStayCompleted,
    isCancelled: req.body.isCancelled,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    bookingDate: req.body.bookingDate,
    userEmail: req.body.userEmail,
    ownerId: req.body.ownerId,
    bookingCost: req.body.bookingCost,
  });
  Logger.ServiceLogger.log('info',`Sucess: booking done for rental:${req.body.rentalID} by  user:${req.body.userID}`)
  //error if booking create fails
  if (!booking) {
    return new AppError('Booking failed', 404);
  }

  const userDetails = await User.findById(booking.userID);
  await sendEmail({
    email: req.body.userEmail,
    subject: 'Thanks for booking with nomadic',
    name: userDetails.name,
    messageBody: `Thanks for booking with us`,
  });
  Logger.ServiceLogger.log('info',`Sucess: Email sent to user:${req.body.email}`)

  const ownerDetails = await User.findById(req.body.ownerId);
  await sendEmail({
    email: ownerDetails.email,
    subject: 'Thanks for booking with nomadic',
    name: ownerDetails.name,
    messageBody: `${req.body.userEmail} has booked your rental, check My orders page for more details `,
  });
  Logger.ServiceLogger.log('info',`Sucess: Email sent to owner:${ownerDetails.email}`)

  Logger.ServiceLogger.log('info',`Sucess: response sent for booking`)
  res.status(201).json({
    status: 'success',
    data: {
      booking,
    },
  });
});

exports.cancelBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return new AppError('Record of booking with given ID is not found', 404);
  } else if (86400 <= Date.now() - booking.startDate) {
    res.status(400).json({
      status: 'fail',
      data: 'You are not allowed to cancel booking before 24hrs of commencment of rental',
    });
  }

  booking.isCancelled = req.body.isCancelled;
  await booking.save();
  Logger.ServiceLogger.log('info',`booking is cancelled for user:${booking.userEmail}`)

  const userDetails = await User.findById(booking.userID);
  await sendEmail({
    email: booking.userEmail,
    subject: 'Booking cancelled',
    name: userDetails.name,
    messageBody: 'Your booking is cancelled succesfully',
  });
Logger.ServiceLogger.log('info',`Sucess: Email sent to user:${booking.userEmail}`)

  const ownerDetails = await User.findById(booking.ownerId);
  await sendEmail({
    email: ownerDetails.email,
    subject: 'Booking cancelled',
    name: ownerDetails.name,
    messageBody: `${booking.userEmail} has cancelled booking for your rental `,
  });
  Logger.ServiceLogger.log('info',`Sucess: email sent to owner:${ownerDetails.email}`)

  Logger.ServiceLogger.log('info',`Sucess: cancelled booking for user:${booking.userEmail} and response sent`)
  res.status(200).json({
    status: 'success',
    data: { booking },
  });
});

exports.getBlockedDates = catchAsync(async (req, res, next) => {
  const blockedDates = await Booking.find({ rentalID: req.params.id, isCancelled: false }).select('startDate endDate');
  if (!blockedDates) {
    return new AppError('Record of booking with given ID is not found', 404);
  }
  Logger.ServiceLogger.log('info','generated block dates successfully')
  res.status(200).json({
    status: 'success',
    data: { blockedDates },
  });
});

exports.getAllBookingsAdmin = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ ownerId: req.params.id })
    .populate({
      path: 'rentalID',
      select: ['rentalName', 'subDestination', 'originalImages', 'price', 'state', 'noOfPeopleAccomodate'],
    })
    .populate({ path: 'userID', select: ['name', 'email'] });
  if (!bookings) {
    return new AppError('There is no booking for your rental', 404);
  }
  Logger.ServiceLogger.log('info','Get all bookings for admin')
  res.status(200).json({
    status: 'success',
    data: { bookings },
  });
});

exports.getAllBookingsUser = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ userID: req.params.id }).populate({
    path: 'rentalID',
    select: ['rentalName', 'subDestination', 'noOfPeopleAccomodate', 'originalImages', 'price', 'state'],
  }).sort({bookingDate:'-1'});

  if (!bookings) {
    return new AppError('you have made no booking', 404);
  }

  Logger.ServiceLogger.log('info','Get all bookings for user ')
  res.status(200).json({
    status: 'success',
    data: { bookings },
  });
});
