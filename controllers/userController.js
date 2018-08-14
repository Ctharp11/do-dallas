const mongoose = require('mongoose');
const passwordValidator = require('password-validator');
const User = mongoose.model('User');
const promisify = require('es6-promisify')

exports.loginForm = (req, res) => {
    res.render('login', {title: 'Login'})
}

exports.registerForm = (req, res) => {
    res.render('register')
}

exports.validateRegister = (req, res, next) => {
    req.sanitizeBody('name');
    req.checkBody('name', 'You must supply a name!').notEmpty();
    req.checkBody('email', 'That email is not valid!').isEmail();
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extensions: false,
        gmail_remove_subaddress: false
    });
    req.checkBody('password', 'You must supply a password!').notEmpty();
    req.checkBody('password-confirm', 'You must confirm your password!').notEmpty();
    req.checkBody('password-confirm', 'Your passwords do not match!').equals(req.body.password);

    const errors = req.validationErrors();
    if(errors) {
        req.flash('error', errors.map(err => err.msg));
        res.render('register', {title: 'Register', body: req.body, flashes: req.flash() });
        return;
    }
    next();
}

exports.validatePassword = (req, res, next) => {
    var schema = new passwordValidator();
    schema.is().min(8)                                
    schema.has().uppercase()  
    schema.has().not().spaces() 
    schema.has().digits()

    const passValidate = schema.validate(req.body.password, { list: true });
    
    if(passValidate.length > 0) {
        console.log(passValidate);
        req.flash('error', 'Your password must be at least 8 characters long, have at least one uppercase letter, at least one number, and no spaces.');
        res.render('register', {title: 'Register', body: req.body, flashes: req.flash() });
        return;
    }
    next();
}

exports.register = async (req, res, next) => {
    const user = new User({email: req.body.email, name: req.body.name});
    const register = promisify(User.register, User);
    await register(user, req.body.password);
    next();
}