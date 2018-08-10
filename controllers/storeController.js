const mongoose = require('mongoose');
const Store = mongoose.model('Store');

exports.homePage = (req, res) => {
    res.render('index')
}

exports.getStore = async (req, res) => {
    const stores = await Store.find();
    console.log(stores)
    res.render('stores', {title: 'Stores', stores});
}

exports.addStore = (req, res) => {
    res.render('editStore', {'title': 'Add Store'})
};

exports.createStore = async (req, res) => {
    const store = await (new Store(req.body)).save();
    req.flash('succes', `Successfully created ${store.name}. Care to leave a review?`)
    res.redirect(`/store/${store.slug}`)
};