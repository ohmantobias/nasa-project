const mongoose = require("mongoose");

const launchesSchema = new mongoose.Schema({
  flightNumber: {
    type: Number,
    required: [true, "A launch must have an flight number!"],
  },
  launchDate: {
    type: Date,
    required: [true, "A launch must have a launch date"],
  },
  mission: {
    type: String,
    required: [true, "A launch must have a mission"],
  },
  rocket: {
    type: String,
    required: [true, "A launch must have a rocket "],
  },
  target: {
    type: String,
  },
  customers: [String],
  upcoming: {
    type: Boolean,
    required: true,
  },
  success: {
    type: Boolean,
    required: true,
    default: true,
  },
});

module.exports = mongoose.model("Launch", launchesSchema);
