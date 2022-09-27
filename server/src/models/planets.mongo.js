const mongoose = require("mongoose");

const planetsSchema = new mongoose.Schema({
  keplerName: {
    type: String,
    required: [true, "A planet must have a name"],
  },
});

module.exports = mongoose.model("Planet", planetsSchema);
