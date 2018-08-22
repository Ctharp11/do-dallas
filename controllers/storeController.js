const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');
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

exports.homePage = async (req, res) => {
    const stores = await Store.find();
    res.render('index', {title: 'Restaurants', stores})
}

exports.getStore = async (req, res) => {
    // const stores = await Store.find();
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true };
    const tagsPromise = Store.getTagsList();
    const storePromise = Store.find({tags: tagQuery});
    const [ tags, stores] = await Promise.all([tagsPromise, storePromise]);    
    res.render('stores', {title: 'Restaurants', tags, tag, stores})
    // res.render('stores', {title: 'Restaurants', stores});
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
    await photo.resize(600, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    next();
}

exports.createStore = async (req, res) => {
    req.body.author = req.user._id;
    try {
        const store = await (new Store(req.body)).save(); 
        req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
        res.redirect(`/store/${store.slug}`);
        return;
    }
    catch(err) {
        if (err.code === 11000) {
           req.flash('error', "This store has already been added! Click here to leave a review.");
           res.redirect('back'); 
        }
        req.flash('error', "Sorry, there was an error!");
        res.redirect('back'); 
        return;
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
}

exports.getStoreBySlug = async (req, res) => {
    const store = await Store.findOne({slug: req.params.slug}).populate('author');
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