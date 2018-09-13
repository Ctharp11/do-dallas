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
        required: 'Please enter a food type!'
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
    tags: {
        type: [String]
    },
    photo: {
        type: String
    },
    photo_id: {
        type: String,
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

storeSchema.statics.getTopCities = function() {
    return this.aggregate([
        {$unwind: '$city'},
        {$group: {_id: '$city', count: {$sum: 1}}},
        {$sort: {count: -1}},
        {$limit: 5}
    ]);
}

storeSchema.statics.getCityReviews = function () {
    return this.aggregate([
        { $lookup: { from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews' }},
        { $match: { 'reviews.2': { $exists: true }}},
        {$group: {
            _id: '$city', 
            city_reviews: { $push : '$reviews'}}
        },
        {"$project":{ "averageRatingIndex":{"$avg":{ "$map":{ "input":"$city_reviews", "in":{"$avg":"$$this.rating"} } }} }},
        { $sort: { averageRatingIndex: -1 }},
        { $limit: 5 }
    ])
}

storeSchema.statics.getTopStores = function() {
    return this.aggregate([
        //look for stores and populate their reviews
        { $lookup: { from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews' }},

        //filter for stores that only have three or more reviews
        { $match: { 'reviews.2': { $exists: true }}},

        //add the average review fields
        { $project: {
            photo: '$$ROOT.photo',
            name: '$$ROOT.name',
            reviews: '$$ROOT.reviews',
            slug: '$$ROOT.slug',
            city: '$$ROOT.city',
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

function autopopulate(next) {
    this.populate('reviews');
    next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);


module.exports = mongoose.model('Store', storeSchema);



