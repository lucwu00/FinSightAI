const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.post('/update-picture', profileController.updateProfilePicture);
router.get('/get-picture', profileController.getProfilePicture);

module.exports = router;
