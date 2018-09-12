const mongoose = require('mongoose');
const Review = mongoose.model('Review');

exports.addReview = async (req, res) => {
    req.body.store = req.params.id;
    req.body.author = req.user._id;
    const newReview = new Review(req.body);
    await newReview.save();
    req.flash('success', 'Your review was saved!')
    res.redirect('back');
    return;
}