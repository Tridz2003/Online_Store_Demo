const express = require('express')
const {check, body} = require('express-validator')

const auth = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', auth.getLogin);

router.post('/login', auth.postLogin);

router.post('/logout', auth.postLogout);

router.get('/signup', auth.getSignup);

router.post('/signup',
    [
        check('email').custom((value, {req}) => {
            if (!value.trim().endsWith('@gmail.com')) {
                throw new Error('Email must end with @gmail.com');
            }
            return User.findOne({email: value})
                .then(user => {
                    if(user){
                        return Promise.reject('Email is already exists');
                        // dùng trong trường hợp có thao tác bất đồng bộ
                    }
                })
        }),
        body('password', 'Please enter only letter and number at least 5 characters')
        .isLength({min: 5}).isAlphanumeric(),
        body('confirmPassword').custom((value, {req}) => {
            if(value !== req.body.password){
                throw new Error("Password confirmation does not match password")
            }
        })
    ],
    auth.postSignup);

router.get('/forgot-password', auth.getForgotPassword);

router.post('/forgot-password', auth.postForgotPassword);

router.get('/reset', auth.getReset);

router.post('/reset', auth.postReset);

router.get('/reset-form/:resetToken', auth.getResetForm)

router.post('/reset-password', auth.postResetPassword)

module.exports = router;