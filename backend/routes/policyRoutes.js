const express = require('express');
const router = express.Router();
const controller = require('../controllers/policyController');

// Existing routes

// Existing routes
router.get('/', controller.getAllPolicies);
router.post('/', controller.createPolicy);
router.put('/:policyId', controller.updatePolicyByPolicyId);
router.delete('/:policyId', controller.deletePolicyByPolicyId);
router.put('/:policyId', controller.updatePolicyByPolicyId);
router.delete('/:policyId', controller.deletePolicyByPolicyId);
router.get('/search/:clientId', controller.getPoliciesByClientId);
router.get('/summary/genai', controller.getPolicySummary);
router.get('/summary/common-types', controller.getCommonCoverageTypes);
router.get('/summary/expiring-clients', controller.findClientsWithExpiringPolicies);
router.get('/summary/incomplete', controller.getIncompletePolicies);
router.get('/top-products', controller.getTopProducts);
router.post('/summary/custom', controller.getCustomPolicySummary);
router.get('/client/:clientId', controller.getPoliciesByClientId);
router.get('/recommendedPolicies', controller.getRecommendedPolicies);

// NEW: Policy Store routes
router.get('/store/policies', controller.getAllStorePolicies);
router.post('/store/policies', controller.createStorePolicy);
router.put('/store/policies/:id', controller.updateStorePolicy);
router.delete('/store/policies/:id', controller.deleteStorePolicy);

router.get('/recommendedPolicies', controller.getRecommendedPolicies);

// NEW: Policy Store routes
router.get('/store/policies', controller.getAllStorePolicies);
router.post('/store/policies', controller.createStorePolicy);
router.put('/store/policies/:id', controller.updateStorePolicy);
router.delete('/store/policies/:id', controller.deleteStorePolicy);

module.exports = router;