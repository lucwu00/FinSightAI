const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

router.get('/', clientController.getAllClients);
router.post('/', clientController.createClient);
router.get('/:id/gap-insights', clientController.getClientGapInsights);
router.put('/:id', clientController.updateClient);

// used by ken
router.get('/search', clientController.getClientBySearch);
router.get('/:id', clientController.getClientBasic);
router.get('/:id/details', clientController.getClientById);

module.exports = router;