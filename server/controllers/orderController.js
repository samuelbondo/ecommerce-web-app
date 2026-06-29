const asyncHandler = require('../utils/asyncHandler');
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');

const placeOrder = asyncHandler(async (req, res) => {
  const { user_id, items, payment_method = 'cod', payment_status = 'pending', payment_id = null } = req.body;
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [order] = await Order.create(user_id, total, payment_method, payment_status, payment_id);
  const orderId = order.insertId;

  const orderItems = items.map((item) => [orderId, item.product_id, item.quantity, item.price]);
  await Order.addItems(orderItems);
  await Cart.clearByUser(user_id);

  res.status(201).json({ message: 'Order placed', orderId });
});

const getUserOrders = asyncHandler(async (req, res) => {
  const [orders] = await Order.findByUser(req.params.user_id);
  for (const order of orders) {
    const [items] = await Order.findItemsByOrder(order.id);
    order.items = items;
  }
  res.json(orders);
});

module.exports = { placeOrder, getUserOrders };
