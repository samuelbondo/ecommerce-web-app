const router = require('express').Router();
const { register, login } = require('../controllers/authController');
const validate = require('../middleware/validate');

router.post('/register', validate(['name', 'email', 'password']), register);
router.post('/login', validate(['email', 'password']), login);

module.exports = router;
