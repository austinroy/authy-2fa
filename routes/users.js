const express = require('express');
const router = express.Router();
const config = require('../config.js');
const users = require('../controllers/users');

router.get('/api', function(req, res) {
  // GET/users/ route
  res.send({name:config.admin.name});
});


router.post('/user/register',users.register);
router.get('/api/logout',users.logout);
router.post('/api/login',users.login);

/**
 * Account Security Authentication API
 */
router.post('/api/accountsecurity/sms', users.sms);
router.post('/api/accountsecurity/voice',users.voice);
router.post('/api/accountsecurity/verify',users.verify);
router.post('/api/accountsecurity/onetouchstatus',users.checkOneTouchStatus);
router.post('/api/accountsecurity/onetouch',users.createOneTouch);

router.post('/api/loggedIn',users.loggedIn);

/**
 * Account Security Phone Verification API
 */
router.post('/api/verification/start', users.requestPhoneVerification);
router.post('/api/verification/verify',users.verifyPhoneToken);

module.exports = router;
