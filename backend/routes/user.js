const express = require('express');
const router = express.Router();
const userController = require('./../controllers/userController');

// used by ken
router.get("/layout-preference", userController.getLayoutPreference)
router.post("/layout-preference", userController.postLayoutPreference)

module.exports = router;