const express = require('express');
const router = express.Router();
const UpdateStudentController = require('../controllers/updateStudentController');

router.get('/profile', UpdateStudentController.getProfile);
router.put('/updateUser', UpdateStudentController.updateUser);
router.get('/logout', UpdateStudentController.logout);
router.get('/restore', UpdateStudentController.getRestorePage);
router.get('/delete', UpdateStudentController.softDeleteUser);
router.post('/restore', UpdateStudentController.restoreUser);
router.get("/delete-page", UpdateStudentController.getDeletePage);
router.get('/my_purchases', UpdateStudentController.getMyPurchases);
module.exports = router;
