const express = require('express');
const router = express.Router();
const config = require('../config.js');
const users = require('../controllers/users');

router.get('/', function(req, res) {
  // GET/users/ route
  res.send({name:config.admin.name});
});



router.get('/logout',users.logout);
router.post('/login',users.login);

/**
 * Account Security Authentication API
 */
router.post('/accountsecurity/sms', users.sms);
router.post('/accountsecurity/voice',users.voice);
router.post('/accountsecurity/verify',users.verify);
router.post('/accountsecurity/onetouchstatus',users.checkOneTouchStatus);
router.post('/accountsecurity/onetouch',users.createOneTouch);

router.post('/loggedIn',users.loggedIn);

/**
 * Account Security Phone Verification API
 */
router.post('/verification/start', users.requestPhoneVerification);
router.post('/verification/verify',users.verifyPhoneToken);

module.exports = router;
