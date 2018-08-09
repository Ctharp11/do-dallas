const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

// const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name: String,
})

module.exports = mongoose.model('Store', storeSchema);



