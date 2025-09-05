const bcrypt = require('bcrypt');
const { Instructor } = require('../required/db.js'); // Import the Mongoose Instructor model

const InstructorModel = {
    findByEmail: async (email) => {
        return await Instructor.findOne({ email });
    },

    findActiveByEmail: async (email) => {
        return await Instructor.findOne({ email, is_deleted: 0 });
    },

    create: async (username, email, contact, address, password) => {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newInstructor = new Instructor({
            name: username,
            email,
            contact,
            address,
            hashed_password: hashedPassword,
            is_deleted: 0
        });
        return await newInstructor.save();
    }
};

module.exports = InstructorModel;
