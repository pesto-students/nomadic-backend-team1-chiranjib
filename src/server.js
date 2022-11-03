// importing env and mongoose package
const dotenv = require('dotenv');
const mongoose = require('mongoose');
//initaitng env config
dotenv.config({ path: '../.env' });
//importing app and razprpay packages
const app = require('./app');
const Razorpay = require('razorpay')
//gather database credentials
const URI = process.env.DATABASE.replace('<password>', process.env.DATABASE_PASSWORD); //"mongodb://localhost:27017/nomadic"

//initate DB connection
const connectDB = async () => {
  try {
    await mongoose.connect(URI);
  } catch (error) {
    console.error(error);
  }
};
//initating razorpay instance
exports.instance = new Razorpay({ key_id: process.env.RAZORPAY_API_KEY, key_secret: process.env.RAZORPAY_API_SECRET });

//establish Db connection
connectDB();
//port definition
const port = process.env.PORT || 3000;
//app server intiating with port no
app.listen(port, () => {
});
