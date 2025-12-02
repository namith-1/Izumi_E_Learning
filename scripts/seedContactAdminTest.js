const db = require('../required/db');
const ContactAdmin = require('../models/instructor/contactModel');
const { Instructor } = require('../required/db');
const { nanoid } = require('nanoid');

async function seed() {
  try {
    // Try to find an existing instructor
    let instructor = await Instructor.findOne();
    if (!instructor) {
      console.log('No instructor found. Creating a test instructor...');
      instructor = new Instructor({
        name: 'Test Instructor',
        email: 'test.instructor@example.com',
        contact: '0000000000',
        address: 'Test Address',
        hashed_password: 'testpw',
        is_deleted: 0
      });
      await instructor.save();
    }

    const token = nanoid(8);

    const doc = new ContactAdmin({
      instructor_id: instructor._id,
      course_id: null,
      message: 'This is a seeded test request (please ignore).',
      priority: 'medium',
      token_number: token,
      status: 'Pending'
    });

    await doc.save();
    console.log('Seeded ContactAdmin request with id:', doc._id.toString());

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
