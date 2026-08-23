const express = require('express');
const router = express.Router();
const nudgesController = require('../controllers/nudgesController');

router.get("/", nudgesController.getNudges)

module.exports = router;