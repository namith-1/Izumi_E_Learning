const Consistency = require("../models/consistencyModel");

exports.listDates = async (req, res) => {
  try {
    const studentId = req.query.studentId || req.session.student;
    if (!studentId)
      return res.status(400).json({ error: "studentId required" });
    const dates = await Consistency.find({ student_id: studentId }).lean();
    res.json(dates.map((d) => d.date));
  } catch (err) {
    console.error("listDates error", err);
    res.status(500).json({ error: err.message });
  }
};

exports.addDate = async (req, res) => {
  try {
    const studentId = req.body.studentId || req.session.student;
    const { date } = req.body; // expect YYYY-MM-DD
    if (!studentId || !date)
      return res.status(400).json({ error: "studentId and date required" });
    const obj = await Consistency.create({ student_id: studentId, date });
    res.status(201).json({ date: obj.date });
  } catch (err) {
    if (err.code === 11000)
      return res.status(200).json({ date: req.body.date }); // already exists
    console.error("addDate error", err);
    res.status(500).json({ error: err.message });
  }
};

exports.removeDate = async (req, res) => {
  try {
    const studentId = req.body.studentId || req.session.student;
    const { date } = req.body;
    if (!studentId || !date)
      return res.status(400).json({ error: "studentId and date required" });
    await Consistency.deleteOne({ student_id: studentId, date });
    res.json({ ok: true });
  } catch (err) {
    console.error("removeDate error", err);
    res.status(500).json({ error: err.message });
  }
};
