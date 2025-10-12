const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const consistencySchema = new Schema(
  {
    student_id: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
  },
  { timestamps: true }
);

// prevent duplicate date entries per student
consistencySchema.index({ student_id: 1, date: 1 }, { unique: true });

module.exports =
  mongoose.models.Consistency ||
  mongoose.model("Consistency", consistencySchema);
