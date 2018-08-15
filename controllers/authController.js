const passport = require('passport');
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed login!',
    successRedirect: '/',
    successFlash: 'You are now logged in!'
})

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'You are now logged out!');
    res.redirect('/')
}

exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'You must be logged in!');
    res.redirect('/login');
}

exports.forgot = async (req, res) => {
    //1) Check if user exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        req.flash('error', 'No user associated with this email!')
        res.redirect('back');
    }

    //2) Set reset and expiry tokens for user
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000 //1 hr from now
    await user.save();

    //3) Send email with token
    const resetUrl = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
    req.flash('success', `You have been emailed a password reset link. ${resetUrl}`)
    res.redirect('back');

    //4) Redirect to login page
};

exports.reset = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
        req.flash('error', 'Password reset invalid or expired')
        res.redirect('/login');
    }
    res.render('reset', {title: 'Reset your Password'});
};

exports.confirmedPasswords = (req, res, next) => {
    if (req.body.password === req.body['password-confirm']) {
        return next();
    }
    req.flash('error', "Your passwords don't match!");
    res.redirect('back');
}

exports.update = async (req, res) => {
    //1) find user and make sure within 1 hr of token
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt: Date.now()}
    });
    if (!user) {
        req.flash('error', 'Password reset is expired or invalid');
        return res.redirect('/login')
    }

    //if user, reset password with new token
    const setPassword = promisify(user.setPassword, user)
    await setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    const updatedUser = await user.save();
    await req.login(updatedUser);
    req.flash('success', 'You password has been reset! You are now logged in!');
    res.redirect('/');
}