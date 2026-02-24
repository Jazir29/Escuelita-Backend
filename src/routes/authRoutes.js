const router      = require('express').Router();
const ctrl        = require('../controllers/authController');
const verifyToken = require('../middlewares/verifyToken');

router.post('/login',  ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me',      verifyToken, ctrl.me);
router.post('/register', ctrl.register);

module.exports = router;
