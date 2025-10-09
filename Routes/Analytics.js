const express = require("express");
const router = express.Router();
const AnalyticsController = require("../Controllers/AnalyticsController")
const ensureAuthenticated = require('../middleware/isAuthenticated');

router.get("/analytics", ensureAuthenticated, AnalyticsController.getYouTubeAnalytics); // ✅ function is correct

module.exports = router;
