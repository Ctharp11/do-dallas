const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
const jimp = require('jimp');
const uuid = require('uuid');
const cloudinary = require('cloudinary');
require('dotenv').config({path: '../variables.env'})
const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter: (req, file, next) => {
        const isPhoto = file.mimetype.startsWith('image/');
        if (isPhoto) {
            next(null, true);
        } else {
            next({message: 'That file type isn\'t allowed!'}, false);
        }
    }
}
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

exports.homePage = async (req, res) => {
    const reviewsP = Store.getCityReviews();
    const citiesP = Store.getTopCities();
    const storesP = Store.find();
    const topsP = Store.getTopStores();
    const [cities, reviews, tops, stores] = await Promise.all([citiesP, reviewsP, topsP, storesP]);
    res.render('index', {title: 'Restaurants', tops, cities, stores, reviews});
}

exports.getStore = async (req, res) => {
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true };
    const tagsPromise = Store.getTagsList();
    const storePromise = Store.find({tags: tagQuery});
    const [ tags, stores] = await Promise.all([tagsPromise, storePromise]);    
    res.render('stores', {title: 'Restaurants', tags, tag, stores})
}

exports.addStore = (req, res) => {
    res.render('editStore', {'title': 'Add Restaurant'})
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
    //is there a new file to resize?
    if (!req.file) {
        next();
        return;
    }
    const extension = req.file.mimetype.split('/')[1];
    //this temp save photo to our req object so it can be used in createStore when we call next
    req.body.photo = `${uuid.v4()}.${extension}`
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    setTimeout(function() {
      next(); 
    }, 0);
}

exports.createStore = (req, res) => {
    if (req.body.photo) {
    cloudinary.v2.uploader.upload(`./public/uploads/store.png`, function(err, result) {
        if (err) {
            console.log(JSON.stringify(err));
            req.flash('error', `Error uploading photo. Please try again! ${err}`);
            res.redirect('back'); 
            return;
        }
        if (result) {
            req.body.author = req.user._id;
            req.body.photo = result.url;
            req.body.photo_id = result.public_id;
        }
            const store = (new Store(req.body))
            .save()
            .then(function(result) {
                req.flash('success', `Successfully created ${result.name}!`);
                res.redirect(`/store/${result.slug}`);
                return;
              }, function(err) {
                if (err.code === 11000) {
                    req.flash('error', "This store has already been added!");
                    res.redirect('back'); 
                    return;
                }
                req.flash('error', "Sorry, there was an error! Make sure you added at least a store address and food type!");
                res.redirect('back'); 
                return;
              });
    });
    } else {
        req.body.author = req.user._id;
        req.body.photo = 'http://res.cloudinary.com/dhq78xeri/image/upload/v1536934984/gf9jagblfzba11wka7tp.png';
        req.body.photo_id = 'store photo';
        const store = (new Store(req.body))
            .save()
            .then(function(result) {
                req.flash('success', `Successfully created ${result.name}!`);
                res.redirect(`/store/${result.slug}`);
                return;
              }, function(err) {
                if (err.code === 11000) {
                    req.flash('error', "This store has already been added!");
                    res.redirect('back'); 
                    return;
                }
                req.flash('error', "Sorry, there was an error! Make sure you added at least a store address and food type!");
                res.redirect('back'); 
                return;
              });
    }
};

const confirmOwner = (store, user) => {
    if (!store.author.equals(user._id)) {
        throw Error('You can only edit stores that you create!');
    }
}

exports.editStore = async (req, res) => {
    const store = await Store.findById({_id: req.params.id})
    confirmOwner(store, req.user);
    res.render('editStore', { title: `Edit ${store.name}`, store})
}

exports.updateStore = async (req, res) => {
    req.body.location.type = 'Point';
    const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, {
        new: true,
        runValidators: true,
    }).exec()
    req.flash('success', `Successfully edited ${store.name}. <a href="/store/${store.slug}"> View store -> </a>`)
    res.redirect(`/stores/${store.id}/edit`);
    return;
}

exports.getStoreBySlug = async (req, res) => {
    const store = await Store.findOne({slug: req.params.slug}).populate('author reviews');
    if (!store) return next();
    res.render('store', { title: store.name, store});
}

exports.getStoresByTag = async (req, res) => {
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true };
    const tagsPromise = Store.getTagsList();
    const storePromise = Store.find({tags: tagQuery});
    const [ tags, stores] = await Promise.all([tagsPromise, storePromise]);    
    res.render('tag', {tags, tag, stores})
}

exports.searchStores = async (req, res) => {
    const store = await Store
    .find({
        $text: {
            $search: req.query.q
        }
    }, {
        score: { $meta: 'textScore'}
    })
    .sort({
        score: { $meta: 'textScore' }
    })
    .limit(5);
    res.json(store);
}

exports.mapStores = async (req, res) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    const q = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates
                },
                $maxDistance: 100000
            }
        }

    }
    const stores = await Store.find(q).select('slug location description photo name').limit(10);
    res.json(stores);
}

exports.mapPage = (req, res) => {
    res.render('map')
}

exports.starStore = async (req, res) => {
    const stars = req.user.stars.map(obj => obj.toString());
    //checking if user has already hearted a store 
    //$pull removes the heart $addToSet adds the heart only once (wont duplicate stars like $push would)
    const operator = stars.includes(req.params.id) ? '$pull' : '$addToSet';
    const user = await User
        .findByIdAndUpdate(req.user._id,
            { [operator]: { stars: req.params.id }},
            //returns the updated user
            { new: true}
        );
    res.json(user);
}

exports.getStars = async (req, res) => {
    const stores = await Store.find({
        _id: { $in: req.user.stars }
    })
    res.render('star', {stores})
}

exports.usersStores = async (req, res) => {
    const stores = await Store.find({

    })
}

exports.topStores = async (req, res) => {
    const tops = await Store.getTopStores();
    res.render('index', tops)
}