//importing express and routes
const express = require('express');
const upload = require('./../../middlewares/multer');
const awsupload = require('./../../controllers/uploadController');
const authController = require('./../../controllers/authController');

//creating route
const router = express.Router();

//defining upload route
router.post('/', authController.userAuthorization, upload.array('file'), awsupload.awsUpload);

module.exports = router;
