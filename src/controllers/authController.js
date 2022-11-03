// impoting dependencies
const jwt = require('jsonwebtoken');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const { promisify } = require('util');
const sendEmail = require('./../utils/email');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const Logger = require('../utils/logger')

//importing user modal
const User = require('./../model/userModel');
const { decode } = require('punycode');

//
const client = new OAuth2Client('817056518934-0p9ituunl6pnooif02pfgli1kr4n5ldh.apps.googleusercontent.com');

//JST token generator
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// signup controller
exports.signup = catchAsync(async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
    });

    Logger.ServiceLogger.log('info',`new user created and added to database`)
    let token = createToken(newUser._id);
    newUser.password = undefined;
    Logger.ServiceLogger.log('info',`Generated token for user:${req.body.name} `)

    const messageBody = `Thanks for signing up with Nomadic, login via https://nomadic-life.netlify.app/`
      await sendEmail({
        email: req.body.email,
        subject: 'Welcome to nomadic',
        name: req.body.name,
        messageBody
      })

      Logger.ServiceLogger.log('info',`Welcome mail sent for user:${req.body.name} `)
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser,
      },
    });
    Logger.ServiceLogger.log('info',`resonse sent for user login:${req.body.name} `)
  } catch (error) {
    if (error.code === 11000) {
      const value = error.keyValue.email;
      Logger.ServiceLogger.log('info',`user:${req.body.email} allready exists`)
      const message = `User with this email: ${value} allready exist. Please use another email!`;
      res.status(403).json({ status: 'fail', data: message });
    }
  }
});

// login controller
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //check email and password is present in body
  if (!email || !password) {
    return next(new AppError('Provide valid email and password', 400));
  }
  // check if user exit and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('incorrect email or password', 401));
  }
  // if all good send jwt token
  let token = createToken(user._id);
  user.password = undefined;

  Logger.ServiceLogger.log('info',`login response sent for user:${req.body.email} `)
  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
});

//googlelogin 
exports.googlelogin = (req, res) => {
  const { tokenId } = req.body;
  client
    .verifyIdToken({
      idToken: tokenId,
      audience: '817056518934-0p9ituunl6pnooif02pfgli1kr4n5ldh.apps.googleusercontent.com',
    })
    .then((response) => {
      const { email_verified, name, email, sub } = response.payload;
      if (email_verified) {
        User.findOne({ email }).exec(async(err, user) => {
          if (err) {
            return res.status(400).json({ error: 'something went wrong' });
          } else {
            if (user) {
              const token = createToken(user._id);
              res.status(200).json({
                status: 'success',
                token,
                data: {
                  user,
                },
              });
            } else {
              const newUser = await User.create({
                name: name,
                email: email,
                password: sub,
                confirmPassword: sub,
              });
              newUser.password = undefined;
              newUser.confirmPassword = undefined;
              const messageBody = `Thanks for signing up with Nomadic`
              Logger.ServiceLogger.log('info',`Created new user for user:${email} `)
              await sendEmail({
                email: email,
                subject: 'Welcome to nomadic',
                name,
                messageBody,
              })
              Logger.ServiceLogger.log('info',`Welcome mail sent for new google user:${email} `)
              const token = createToken(newUser._id);

              res.status(200).json({
                status: 'success',
                token,
                data: {
                  user:newUser,
                },
              });
            }
          }
        });
      }
    });
};

exports.userAuthorization = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  //  Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  // Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.id)) {
    return next(new AppError('User recently changed password! Please log in again.', 401));
  }

  // granting access to user
  Logger.ServiceLogger.log('info',`user ${decoded.id} is authorized`)
  req.user = currentUser;
  next();
});

//forgot password controller
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //find the user
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user found with this email address', 404));
  }
  // create random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //create reset url
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  //set message
  const messageBody = `Forgot your password? set your new password by following this link: ${resetURL}`

  try {
    await sendEmail({
      email: user.email,
      subject: 'Set your password (valid for 10 min)',
      name:user.name,
      messageBody
    });

    Logger.ServiceLogger.log('info',`reset mail is sent to user ${req.body.email}`)
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
    Logger.ServiceLogger.log('info',`response sent to user ${req.body.email}`)
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the email. Try again later!'), 500);
  }
});

//reset password controller
exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get the user based on the token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //set new password if user token has not expired
  if (!user) {
    Logger.ServiceLogger.log('info',`token is invalid`)
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  user.confirmPassword = undefined;
  user.password = undefined;

  //send success message
  Logger.ServiceLogger.log('info',`password is reset successfully and response is sent`)
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

//update password controller

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    Logger.ServiceLogger.log('info',`user current password is wrong`)
    return next(new AppError('Your current password is wrong.', 401));
  }

  //Now update password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  user.password = undefined;
  user.confirmPassword = undefined;
  //send success message
  Logger.ServiceLogger.log('info',`Password is updated successfully and response is sent`)
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  // Get user and update user from collection

  const user = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
    runValidators: false,
  });

  Logger.ServiceLogger.log('info',`user ${req.user.id} data is updated successfully`)
  res.status(200).json({
    status: 'success',
    data: { user },
  });

});
