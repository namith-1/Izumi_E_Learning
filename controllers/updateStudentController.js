const path = require('path');
const StudentModel = require('../models/studentModel'); // Import the Mongoose model
const mongoose = require('mongoose');
const { get } = require('http');

const UpdateStudentController = {
    getProfile: (req, res) => {
        if (req.session.student) {
            res.status(200).sendFile(path.join(__dirname, '../views/updateStudent/update_info.html'));
        } else {
            res.status(403).send('Unauthorized');
        }
    },

        getMyPurchases: (req, res) => {
            if (req.session.student) {
                res.status(200).sendFile(path.join(__dirname, '../views/updateStudent/my_purchases.html'));
            } else {
                res.status(403).send('Unauthorized');
            }
        },
    
        updateUser: async (req, res) => {
            const { id, field, value } = req.body;
    
            if (!id || !field || value === undefined) {
                return res.status(400).send("Invalid request parameters: id, field, and value are required.");
            }
    
            if (!mongoose.Types.ObjectId.isValid(id)) { // Add this check
                return res.status(400).send("Invalid student ID.");
            }
    
            try {
                const result = await StudentModel.updateField(id, field, value);
                if (result.nModified === 0) {
                    return res.status(400).send("No changes made.");
                }
                res.send("User updated successfully.");
            } catch (error) {
                console.error("Update user error:", error);
                return res.status(500).send("Error updating user: " + error.message);
            }
        },
    
        logout: (req, res) => {
            req.session.destroy((err) => {
                if (err) console.error('Error destroying session:', err);
                res.redirect('/');
            });
        },
    
        getRestorePage: (req, res) => {
            if (req.session.student) {
                res.redirect('/home');
            } else {
                res.sendFile(path.join(__dirname, '../views/updateStudent/restore.html'));
            }
        },
    
        softDeleteUser: async (req, res) => {
            if (!req.session.student) return res.status(403).send('Unauthorized.');
    
            try {
                const result = await StudentModel.softDelete(req.session.student);
                if (result.nModified === 0) {  // Use nModified for Mongoose
                    return res.status(400).send("No changes made.");
                }
                req.session.destroy((err) => {
                    if (err) console.error("Error destroying session after soft delete", err);
                    res.send('User account soft deleted.');
                });
    
            } catch (error) {
                console.error("Soft delete error:", error);
                return res.status(500).send('Error deleting user: ' + error.message);
            }
        },
    
        restoreUser: async (req, res) => {
            const { email } = req.body;
    
            try {
                const user = await StudentModel.findByEmail(email);
                if (!user || user.is_deleted !== 1) {
                    return res.status(400).send('No deleted user found with this email.');
                }
    
                await StudentModel.restoreAccount(email);
                res.send('User account restored.');
            } catch (error) {
                console.error("Restore user error:", error);
                return res.status(500).send('Error restoring account: ' + error.message);
            }
        },

        getStudentInfo: async (req, res) => {
            if (!req.session.student) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            
            try {
                const student = await StudentModel.getStudentById(req.session.student);
                if (!student) {
                    return res.status(404).json({ error: 'Student not found' });
                }
                res.json(student);
            } catch (error) {
                console.error("Get student info error:", error);
                res.status(500).json({ error: "Error fetching student info" });
            }
        },
    
        getDeletePage: (req, res) => {
            if (!req.session.student) return res.status(403).send("Unauthorized.");
            res.sendFile(path.join(__dirname, "../views/updateStudent", "delete.html"));
        }
    };

    module.exports = UpdateStudentController;
