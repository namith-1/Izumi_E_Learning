const Goal = require("../models/goalModel");

exports.listGoals = async (req, res) => {
  try {
    const studentId = req.query.studentId || req.session.student;
    if (!studentId)
      return res.status(400).json({ error: "studentId required" });
    const goals = await Goal.find({ student_id: studentId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(goals);
  } catch (err) {
    console.error("listGoals error", err);
    res.status(500).json({ error: err.message });
  }
};

exports.createGoal = async (req, res) => {
  try {
    const studentId = req.body.studentId || req.session.student;
    const { name, description } = req.body;
    if (!studentId || !name)
      return res.status(400).json({ error: "studentId and name required" });
    const goal = await Goal.create({
      student_id: studentId,
      name,
      description,
    });
    res.status(201).json(goal);
  } catch (err) {
    console.error("createGoal error", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    const updated = await Goal.findByIdAndUpdate(id, updates, {
      new: true,
    }).lean();
    if (!updated) return res.status(404).json({ error: "not found" });
    res.json(updated);
  } catch (err) {
    console.error("updateGoal error", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const id = req.params.id;
    await Goal.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) {
    console.error("deleteGoal error", err);
    res.status(500).json({ error: err.message });
  }
};
