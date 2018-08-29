import crypto from 'crypto';
import User from '../models/User';
import config from '../config';
import { Client } from 'authy-client';
import qs from 'querystring';
import request from 'request';

const phoneReg = require('../lib/phoneVerification')(config.API_KEY);


const authy = new Client ({ key : config.API_KEY });

const hashPW = (pwd) => {
    return crypto.createHash('sha256').update(pwd).digest('base64').toString();
}


/**
 * Login a user
 * @param req
 * @param res
 */
export const login = (req, res ) => {
    User.findOne({username: req.body.username})
    .exec(function (err, user) {
        if (!user) {
            err = 'Username Not Found';
        } else if (('password' in req.body) && (user.hashed_password !==
            hashPW(req.body.password.toString()))) {
            err = 'Wrong Password';
        } else {
            createSession(req, res, user);
        }

        if (err) {
            res.status(500).json(err);
        }
    });
}

/**
 * Logout a user
 *
 * @param req
 * @param res
 */
export const logout = (req, res, next ) => {
    req.session.destroy(function (err) {
        if (err) {
            console.log("Error Logging Out: ", err);
            return next(err);
        }
        res.status(200).send();
    });
}

/**
 * Checks to see if the user is logged in and redirects appropriately
 *
 * @param req
 * @param res
 */
export const loggedIn = (req, res ) => {
    if (req.session.loggedIn && req.session.authy) {
        res.status(200).json({url: "/protected"});
    } else if (req.session.loggedIn && !req.session.authy) {
        res.status(200).json({url: "/2fa"});
    } else {
        res.status(409).send();
    }
}

/**
 * Sign up a new user.
 *
 * @param req
 * @param res
 */
export const register = (req, res) => {
    const username = req.body.username;
    User.findOne({username: username}).exec(function (err, user) {
        if (err) {
            console.log('Rregistration Error', err);
            res.status(500).json(err);
            return;
        }
        if (user) {
            res.status(409).json({err: "Username Already Registered"});
            return;
        }

        user = new User({username: req.body.username});

        user.set('hashed_password', hashPW(req.body.password));
        user.set('email', req.body.email);
        user.set('authyId', null);
        user.save(function (err) {
            if (err) {
                console.log('Error Creating User', err);
                res.status(500).json(err);
            } else {

                authy.registerUser({
                    countryCode: req.body.country_code,
                    email: req.body.email,
                    phone: req.body.phone_number
                }, function (err, regRes) {
                    if (err) {
                        console.log('Error Registering User with Account Security');
                        res.status(500).json(err);
                        return;
                    }

                    user.set('authyId', regRes.user.id);

                    // Save the AuthyID into the database then request an SMS
                    user.save(function (err) {
                        if (err) {
                            console.log('error saving user in authyId registration ', err);
                            res.session.error = err;
                            res.status(500).json(err);
                        } else {
                            createSession(req, res, user);
                        }
                    });
                });
            }
        });
    });
}

/**
 * Request a Time-based One Time Password (TOTP) via SMS
 *
 * @param req
 * @param res
 */
export const sms = (req, res) => {
    const username = req.session.username;
    User.findOne({username: username}).exec(function (err, user) {
        console.log("Send SMS");
        if (err) {
            console.log('SendSMS', err);
            res.status(500).json(err);
            return;
        }

        /**
         * If the user has the Authy app installed, it'll send a text
         * to open the Authy app to the TOTP token for this particular app.
         *
         * Passing force: true forces an SMS send.
         */
        authy.requestSms({authyId: user.authyId}, {force: true}, function (err, smsRes) {
            if (err) {
                console.log('ERROR requestSms', err);
                res.status(500).json(err);
                return;
            }
            console.log("requestSMS response: ", smsRes);
            res.status(200).json(smsRes);
        });
    });
}

/**
 * Verify an Authy Token
 *
 * @param req
 * @param res
 */
export const verify = (req, res) => {
    var username = req.session.username;
    User.findOne({username: username}).exec(function (err, user) {
        console.log("Verify Token");
        if (err) {
            console.error('Verify Token User Error: ', err);
            res.status(500).json(err);
        }
        authy.verifyToken({authyId: user.authyId, token: req.body.token}, function (err, tokenRes) {
            if (err) {
                console.log("Verify Token Error: ", err);
                res.status(500).json(err);
                return;
            }
            console.log("Verify Token Response: ", tokenRes);
            if (tokenRes.success) {
                req.session.authy = true;
            }
            res.status(200).json(tokenRes);
        });
    });
}

/**
 * Create a Push Notification request.
 * The front-end client will poll 12 times at a frequency of 5 seconds before terminating.
 * If the status is changed to approved, it quit polling and process the user.
 *
 * @param req
 * @param res
 */

export const createOneTouch = ( req, res) => {
    const username = req.session.username;
    console.log("username: ", username);
    User.findOne({username: username}).exec(function (err, user) {
        if (err) {
            console.error("Create Push User Error: ", err);
            res.status(500).json(err);
        }

        const request = {
            authyId: user.authyId,
            details: {
                hidden: {
                    "test": "This is a"
                },
                visible: {
                    "Authy ID": user.authyId,
                    "Username": user.username,
                    "Location": 'Nairobi, NBO',
                    "Reason": 'Demo by Account Security'
                }
            },
            message: 'Login requested for Account Security account.'
        };

        authy.createApprovalRequest(request, {ttl: 120}, function (oneTouchErr, oneTouchRes) {
            if (oneTouchErr) {
                console.error("Create Push Error: ", oneTouchErr);
                res.status(500).json(oneTouchErr);
                return;
            }
            console.log("Push Notification Response: ", oneTouchRes);
            req.session.uuid = oneTouchRes.approval_request.uuid;
            res.status(200).json(oneTouchRes)
        });

    });
}

/**
 * Verify the Push Notification request callback via HMAC inspection.
 *
 * @url https://en.wikipedia.org/wiki/Hash-based_message_authentication_code
 * @url https://gist.github.com/josh-authy/72952c62521480f3dd710dcbad0d8c42
 *
 * @param req
 * @return {Boolean}
 */
export const verifyCallback = (req) => {

    const apiKey = config.API_KEY;

    const url = req.headers['x-forwarded-proto'] + "://" + req.hostname + req.url;
    const method = req.method;
    const params = req.body;

    // Sort the params.
    const sorted_params = qs.stringify(params).split("&").sort().join("&").replace(/%20/g, '+');

    const nonce = req.headers["x-authy-signature-nonce"];
    const data = nonce + "|" + method + "|" + url + "|" + sorted_params;

    const computed_sig = crypto.createHmac('sha256', apiKey).update(data).digest('base64');
    const sig = req.headers["x-authy-signature"];

    return sig == computed_sig;
}

/**
 * Poll for the OneTouch status.  Return the response to the client.
 * Set the user session 'authy' variable to true if authenticated.
 *
 * @param req
 * @param res
 */
export const checkOneTouchStatus = (req, res) => {
    const options = {
        url: "https://api.authy.com/onetouch/json/approval_requests/" + req.session.uuid,
        form: {
            "api_key": config.API_KEY
        },
        headers: {},
        qs: {
            "api_key": config.API_KEY
        },
        json: true,
        jar: false,
        strictSSL: true
    };

    request.get(options, function (err, response) {
        if (err) {
            console.log("OneTouch Status Request Error: ", err);
            res.status(500).json(err);
        }
        console.log("OneTouch Status Response: ", response);
        if (response.body.approval_request.status === "approved") {
            req.session.authy = true;
        }
        res.status(200).json(response);
    });
}

/**
 * Register a phone
 *
 * @param req
 * @param res
 */
export const requestPhoneVerification = (req, res) => {
    const phone_number = req.body.phone_number;
    const country_code = req.body.country_code;
    const via = req.body.via;

    console.log("body: ", req.body);

    if (phone_number && country_code && via) {
        phoneReg.requestPhoneVerification(phone_number, country_code, via, function (err, response) {
            if (err) {
                console.log('error creating phone reg request', err);
                res.status(500).json(err);
            } else {
                console.log('Success register phone API call: ', response);
                res.status(200).json(response);
            }
        });
    } else {
        console.log('Failed in Register Phone API Call', req.body);
        res.status(500).json({error: "Missing fields"});
    }
}

/**
 * Confirm a phone registration token
 *
 * @param req
 * @param res
 */
export const verifyPhoneToken = (req, res) => {
    const country_code = req.body.country_code;
    const phone_number = req.body.phone_number;
    const token = req.body.token;
    
    if (phone_number && country_code && token) {
        phoneReg.verifyPhoneToken(phone_number, country_code, token, function (err, response) {
            if (err) {
                console.log('error creating phone reg request', err);
                res.status(500).json(err);
            } else {
                console.log('Confirm phone success confirming code: ', response);
                if (response.success) {
                    req.session.ph_verified = true;
                }
                res.status(200).json(err);
            }

        });
    } else {
        console.log('Failed in Confirm Phone request body: ', req.body);
        res.status(500).json({error: "Missing fields"});
    }
}

/**
 * Request a Time-based One Time Password (TOTP) via a voice call
 *
 * @param req
 * @param res
 */
export const voice = (req, res) => {
    const username = req.session.username;
    User.findOne({username: username}).exec(function (err, user) {
        console.log("Send Voice");
        if (err) {
            console.log('ERROR SendVoice', err);
            res.status(500).json(err);
            return;
        }

        /**
         * If the user has the Authy app installed, it'll send a text
         * to open the Authy app to the TOTP token for this particular app.
         *
         * Passing force: true forces an voice call to be made
         */
        authy.requestCall({authyId: user.authyId}, {force: true}, function (err, callRes) {
            if (err) {
                console.error('ERROR requestcall', err);
                res.status(500).json(err);
                return;
            }
            console.log("requestCall response: ", callRes);
            res.status(200).json(callRes);
        });
    });
}

/**
 * Create the initial user session.
 *
 * @param req
 * @param res
 * @param user
 */
const createSession = (req, res, user) => {
    req.session.regenerate(function () {
        req.session.loggedIn = true;
        req.session.user = user.id;
        req.session.username = user.username;
        req.session.msg = 'Authenticated as: ' + user.username;
        req.session.authy = false;
        req.session.ph_verified = false;
        res.status(200).json();
    });
}
