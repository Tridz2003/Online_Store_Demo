const User = require("../models/user");

const BCrypt = require('bcryptjs')
const crypto = require('crypto')
const {validationResult} = require('express-validator')
const sendMail = require('../helpers/send-email');

exports.getLogin = (req, res, next) => {
    let message = req.flash('error')
    if(message.length > 0){
        message = message[0];
    }else{
        message = null;
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: message,
        isAuthencatied: false
    })
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({email: email})
    .then(user => {
        if(!user) {
            req.flash('error', 'Invalid email or password')
            return res.redirect('/login');
        }
        BCrypt.compare(password, user.password)
        .then(doMatch => {
            if(doMatch){
                req.session.user = user
                req.session.isLogin = true
                return req.session.save(err => {
                    res.redirect('/')
                });
            }
            req.flash('error', 'Invalid email or password')
            return res.redirect('/login')
        })
    })
}

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        return res.redirect('/');
    });
}

exports.getSignup = (req, res, next) => {
    let message = req.flash('error')
    if(message.length > 0){
        message = message[0]
    }else{
        message = null;
    }
    res.render('auth/signup', {
        path: 'signup',
        pageTitle: 'Signup',
        errorMessage: message,
        oldEmail: null,
        isAuthencatied: false
    });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors.array())
        return res.status(422).render('auth/signup', {
            path: 'signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            isAuthencatied: false,
            oldEmail: email
        })
    }
    BCrypt.hash(password, 12)
        .then(bcyptPassword => {
            const user = new User({email: email, password: bcyptPassword, cart: {items: []}});
            return user.save();
        })
        .then(result => {
            res.redirect('/login')
        })
        .catch(err => {console.log(err)})
}

exports.getForgotPassword = (req, res, next) => {
    let message = req.flash('error')
    if(message.length > 0){
        message = message[0];
    }else{
        message = null;
    }
    res.render('auth/forgot-password', {
        path: '/forgot-password',
        pageTitle: 'Forgot password',
        errorMessage: message,
        isAuthencatied: false
    })
}

exports.postForgotPassword = (req, res, next) => {
    const email = req.body.email;
    const generateRandomCode = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };
    const randomCode = generateRandomCode();
    User.findOne({email: email})
    .then(user => {
        if (!user) {
            req.flash('error', 'No account with that email found.');
            return res.redirect('/forgot-password');
        }
        return BCrypt.hash(randomCode, 12).then(bcryptPassword => {
            user.password = bcryptPassword;
            return user.save();
        })
        .then(result => {
            req.flash('success', 'Password reset successfully. Please check your email for the new password.');
            return sendMail({
                email: email,
                subject: 'Password Reset',
                html: `<p>Your new password is: ${randomCode}</p>`
            });
        })
        .then(() => {
            res.redirect('/login');
        })
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Error resetting password.');
        return res.redirect('/forgot-password');
    });
}

exports.getReset = (req, res, next) => {
    let message = req.flash('error')
    if(message.length > 0){
        message = message[0];
    }else{
        message = null;
    }
    res.render('auth/reset-password-email', {
        path: '/reset_password',
        pageTitle: 'Reset password',
        errorMessage: message,
        isAuthencatied: false
    })
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if(err){
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex')
        User.findOne({email: req.body.email})
        .then(user => {
            if(!user){
                req.flash('error', 'No account found')
                return res.redirect('/reset')
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save();
        })
        .then(result => {
            if (result) {
                return res.redirect(`/reset-form/${token}`);
            }
        })
        .catch(err => console.log(err));
    });
}

exports.getResetForm = (req, res, next) => {
    const token = req.params.resetToken;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
    .then(user => {
        let message = req.flash('error')
        if(message.length > 0){
            message = message[0];
        }else{
            message = null;
        }
        res.render('auth/reset-password-form', {
            path: '/reset-form',
            pageTitle: 'Reset password form',
            errorMessage: message,
            isAuthencatied: false,
            resetToken: token,
            userId: user._id
        })
    })
}

exports.postResetPassword = (req, res, next) => {
    const userId = req.body.userId;
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;
    const resetToken = req.body.resetToken;
    // console.log(newPassword, " ", confirmPassword);
    if (!newPassword || newPassword.trim() === '' || newPassword !== confirmPassword) {
        req.flash('error', 'Not match')
        return res.redirect(`/reset-form/${resetToken}`)
    }
    User.findOne({
        _id: userId,
        resetToken: resetToken,
        resetTokenExpiration: {$gt: Date.now()}
    })
    .then(user => {
        if(!user){
            req.flash('error', 'Error of Expiration')
            return res.redirect('/reset')
        }
        // console.log(user);
        BCrypt.hash(newPassword, 12)
        .then(bcryptPassword => {
            user.password = bcryptPassword;
            user.resetToken = undefined;
            user.resetTokenExpiration = undefined;
            return user.save();
        })
        .then(result => {
            if(result){
                console.log('Updated Password')
                return res.redirect('/login')
            }
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}