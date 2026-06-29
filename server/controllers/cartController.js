const asyncHandler = require('../utils/asyncHandler');
const Cart = require('../models/cartModel');

const getCart = asyncHandler(async (req, res) => {
  const [rows] = await Cart.findByUser(req.params.user_id);
  res.json(rows);
});

const addToCart = asyncHandler(async (req, res) => {
  const { user_id, product_id, quantity } = req.body;
  const [existing] = await Cart.findItem(user_id, product_id);
  if (existing.length) {
    await Cart.updateQuantity(existing[0].id, quantity || 1);
  } else {
    await Cart.addItem(user_id, product_id, quantity || 1);
  }
  res.json({ message: 'Cart updated' });
});

const removeFromCart = asyncHandler(async (req, res) => {
  await Cart.removeItem(req.params.id);
  res.json({ message: 'Item removed from cart' });
});

module.exports = { getCart, addToCart, removeFromCart };
