//importing mongoose 
const mongoose = require('mongoose');

// importing dependencies
const bcrypt = require('bcryptjs');
const validator = require('validator');
const crypto = require('crypto');

//user schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    required: [true, 'Provide your email address'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide valid email address'],
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
    },
    message: 'passwords are not the same',
  },
  address: String,
  mobileNumber: Number,
  isEmailVerfied: {
    type: Boolean,
    default: false,
  },
  changedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

//mongo methods for pre and post data validation

// hashing the password before saving it
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.confirmPassword = undefined;
  next();
});

userSchema.methods.correctPassword = async function (userPassword, savedPassword) {
  return await bcrypt.compare(userPassword, savedPassword);
};

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.changedAt = Date.now() - 1000;
  next();
});

userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.changedAt) {
    const changedTimestamp = parseInt(this.changedAt.getTime() / 1000, 10);

    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
