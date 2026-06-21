const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Course = require('./models/Course');

async function test() {
  try {
    console.log('Connecting to:', process.env.MONGO_URI.replace(/:([^:@]+)@/, ':****@'));
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected!');

    const count = await Course.countDocuments();
    console.log('Course count:', count);

    const explain = await Course.find().limit(1).explain('executionStats');
    console.log('Explain success!');
    console.log('Plan:', explain.queryPlanner.winningPlan.stage);

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

test();
