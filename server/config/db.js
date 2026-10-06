const mongoose = require("mongoose");
const User = require("../models/User");


const connectDB = async () => {

  try {

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "MongoDB connected successfully"
    );


    // =====================================================
    // RESET USER STATUS WHEN SERVER STARTS
    // =====================================================

    await User.updateMany(
      {},
      {
        $set: {
          status: "Offline"
        }
      }
    );


    console.log(
      "All users set to Offline"
    );


  } catch (error) {

    console.error(
      "MongoDB connection failed:",
      error.message
    );

    process.exit(1);

  }

};


module.exports = connectDB;