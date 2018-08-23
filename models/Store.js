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
}, {
    toJSON: {virtuals: true },
    toObject: {virtuals: true }
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

storeSchema.statics.getTagsList = function() {
    return this.aggregate([
        {$unwind: '$tags'},
        {$group: {_id: '$tags', count: {$sum: 1}}},
        {$sort: {count: -1}}
    ]);
}

storeSchema.statics.getTopStores = function() {
    return this.aggregate([
        //look for stores and populate their reviews
        { $lookup: { from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews' }},

        //filter for stores that only have two or more reviews
        { $match: { 'reviews.4': { $exists: true }}},

        //add the average review fields
        { $project: {
            photo: '$$ROOT.photo',
            name: '$$ROOT.name',
            reviews: '$$ROOT.reviews',
            averageRating: { $avg: '$reviews.rating'}
        }},

        //sort it by our new field, highest reviews first 

        { $sort: { averageRating: -1 }},

        //limit it to 10 at most
        { $limit: 10 }
    ])
}

//find review where store's id property is equal to the review's stores property
storeSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'store'
})


module.exports = mongoose.model('Store', storeSchema);



