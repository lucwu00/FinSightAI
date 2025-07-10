const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

router.get('/', clientController.getAllClients); // GET /api/clients
router.post('/', clientController.createClient); // optional for adding clients manually

module.exports = router;
