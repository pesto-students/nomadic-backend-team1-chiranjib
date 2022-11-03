const catchAsync = require('./../utils/catchAsync');
const s3upload = require('./../utils/s3upload');
const Logger = require('../utils/logger')

exports.awsUpload = catchAsync(async (req, res, next) => {
  try {
    const results = await s3upload(req.files);
    Logger.ServiceLogger.log('info',`Data uploaded to AWS successfully`)
    return res.status(201).json({ status: 'success', data: results });
  } catch (err) {
    Logger.ServiceLogger.log('info',`Error data upload failed`)
    res.status(400).json({
      status: 'fail',
    });
  }
});
