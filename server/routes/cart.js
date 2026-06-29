const router = require('express').Router();
const { getCart, addToCart, removeFromCart } = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/:user_id', authenticate, getCart);
router.post('/', authenticate, validate(['user_id', 'product_id']), addToCart);
router.delete('/:id', authenticate, removeFromCart);

module.exports = router;
