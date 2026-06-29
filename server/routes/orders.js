const router = require('express').Router();
const { placeOrder, getUserOrders } = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/', authenticate, validate(['user_id', 'items']), placeOrder);
router.get('/:user_id', authenticate, getUserOrders);

module.exports = router;
