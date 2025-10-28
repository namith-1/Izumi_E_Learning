const express = require('express');
const router = express.Router();
const magazineController = require('../controllers/magazineController');

router.get('/magazines', magazineController.getAllMagazines);

module.exports = router;
