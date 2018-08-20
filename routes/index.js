const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
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
    catchErrors(storeController.createStore)
);
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));
router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag))
router.get('/login', userController.loginForm);
router.get('/register', userController.registerForm);
router.post('/register', 
    userController.validateRegister,
    userController.validatePassword,
    userController.register,
    authController.login
);
router.get('/logout', authController.logout);
router.post('/login', authController.login);
router.get('/account', userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token', 
    authController.confirmedPasswords,
    catchErrors(authController.update)
);

router.get('/api/search/', catchErrors(storeController.searchStores));


module.exports = router;