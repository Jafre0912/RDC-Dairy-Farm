const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {});
  } catch (error) {
    console.log("MongoDB connection ERROR: ", error);
    process.exit(1);
  }
};

module.exports = connectDB;
