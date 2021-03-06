const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const reviewController = require('../controllers/reviewController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { catchErrors } = require('../handlers/errorHandlers');

router.get('/', catchErrors(storeController.homePage));
router.get('/stores', catchErrors(storeController.getStore));
router.get('/stores/:id/edit', catchErrors(storeController.editStore));
router.get('/add', 
    authController.isLoggedIn, 
    storeController.addStore
);
router.post('/add/:id', 
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.updateStore)
);
router.post('/add', 
    storeController.upload,
    catchErrors(storeController.resize),
    storeController.createStore
);
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));
router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag))
router.get('/login', userController.loginForm);
router.get('/register', userController.registerForm);
router.post('/register', 
    userController.validateRegister,
    userController.validatePassword,
    catchErrors(userController.register),
    authController.login
);
router.get('/logout', authController.logout);
router.post('/login', authController.login);
router.get('/account', catchErrors(userController.account));
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token', 
    authController.confirmedPasswords,
    authController.passwordValidation,
    catchErrors(authController.update)
);
router.get('/map', storeController.mapPage);
router.post('/reviews/:id', 
    authController.isLoggedIn, 
    catchErrors(reviewController.addReview)
);
router.get('/top', storeController.topStores);

//APIs
router.get('/api/search/', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));
router.post('/api/store/:id/star', catchErrors(storeController.starStore));
router.get('/stars', catchErrors(storeController.getStars));

module.exports = router;