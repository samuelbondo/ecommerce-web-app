const router = require('express').Router();
const { placeOrder, getUserOrders, resendReceipt } = require('../controllers/orderController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/', authenticate, validate(['user_id', 'items']), placeOrder);
router.get('/:user_id', authenticate, getUserOrders);

// Admin: resend receipt email
router.post('/:id/resend-receipt', authenticate, requireAdmin, resendReceipt);

module.exports = router;
