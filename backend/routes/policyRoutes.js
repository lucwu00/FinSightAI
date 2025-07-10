const express = require('express');
const router = express.Router();
const controller = require('../controllers/policyController');
  

router.get('/', controller.getAllPolicies);
router.post('/', controller.createPolicy);
router.put('/:id', controller.updatePolicy);
router.delete('/:id', controller.deletePolicy);

router.get('/search/:clientId', controller.getPoliciesByClientId);

router.get('/summary/genai', controller.getPolicySummary);
router.get('/summary/common-types', controller.getCommonCoverageTypes);
router.get('/summary/expiring-clients', controller.findClientsWithExpiringPolicies);
router.get('/summary/incomplete', controller.getIncompletePolicies);
router.post('/summary/custom', controller.getCustomPolicySummary);

router.get('/client/:clientId', controller.getPoliciesByClientId);

module.exports = router;
