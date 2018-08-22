const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: 'Please enter a store name!'
    },
    slug: String,
    description: {
        type: String,
        trim: true,
        required: 'Please enter a description!'
    },
    tags: {
        type: [String],
        required: 'Please add at least one tag!'
    },
    created: {
        type: Date,
        default: Date.now()
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [{
            type: Number
        }],
        address: {
            type: String,
            required: 'Please enter an address!'
        }
    },
    photo: {
        type: String,
        required: 'Please add a photo!'
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    city: {
        type: String
    }
});

storeSchema.pre('save', async function(next) {
    if (!this.isModified('name')) {
        next();
        return;
    }
    this.slug = slug(this.name);

    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*&)?)$`, 'i');
    const storesWithSlug = await this.constructor.find({slug: slugRegEx});
    if (storesWithSlug.length) {
        this.slug = `${this.slug}-${storesWithSlug.length + 1}`
    }
    next();
});

//indexes for faster dropdown search
storeSchema.index({
    name: 'text',
    description: 'text',
    city: 'text'
});

//index for geospatial
storeSchema.index( {location: '2dsphere'} );

//index for user account info ---- Need author to get stores back and personal reviews
// storeSchema.index({
//     author: 'text',
//     description: 'text',
//     city: 'text'
// });

storeSchema.statics.getTagsList = function() {
    return this.aggregate([
        {$unwind: '$tags'},
        {$group: {_id: '$tags', count: {$sum: 1}}},
        {$sort: {count: -1}}
    ]);
}


module.exports = mongoose.model('Store', storeSchema);



