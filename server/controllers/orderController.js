const asyncHandler = require('../utils/asyncHandler');
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const { buildReceiptHTML } = require('../utils/emailTemplates');
const { fmtOrderId } = require('../utils/formatOrderId');
const { Resend } = require('resend');
const db = require('../config/db');

const resend = new Resend(process.env.RESEND_API_KEY);

const placeOrder = asyncHandler(async (req, res) => {
  const {
    user_id,
    items,
    payment_method = 'cod',
    payment_status = 'pending',
    payment_id = null,
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
  } = req.body;

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [order] = await Order.create(
    user_id, total, payment_method, payment_status, payment_id,
    customer_name, customer_email, customer_phone, customer_address
  );
  const orderId = order.insertId;

  const orderItems = items.map(item => [
    orderId,
    item.product_id,
    item.variant_id || null,
    item.variant_name || null,
    item.quantity,
    item.price,
  ]);
  await Order.addItems(orderItems);
  await Cart.clearByUser(user_id);

  // Send receipt email (non-blocking — don't fail the order if email fails)
  const emailTo = customer_email || req.user?.email;
  if (emailTo) {
    const [itemRows] = await Order.findItemsByOrder(orderId);
    const html = buildReceiptHTML({
      id: orderId,
      customer_name: customer_name || req.user?.name || 'Customer',
      customer_email: emailTo,
      customer_phone: customer_phone || '',
      customer_address: customer_address || '',
      payment_method,
      payment_status,
      total,
      items: itemRows,
      created_at: new Date(),
    });

    resend.emails.send({
      from: `Samuel Store <${process.env.MAIL_FROM || 'no-reply@samuelstore.com'}>`,
      to: emailTo,
      subject: `✅ Order Confirmed — ${fmtOrderId(orderId, new Date())} | Samuel Store`,
      html,
    }).catch(err => console.error('Receipt email failed:', err.message));
  }

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

/**
 * Resend receipt email for a specific order.
 * Called by admin: POST /api/admin/orders/:id/resend-receipt
 */
const resendReceipt = asyncHandler(async (req, res) => {
  const orderId = req.params.id;

  const [[order]] = await db.query(
    `SELECT o.*, u.name AS u_name, u.email AS u_email
     FROM orders o LEFT JOIN users u ON o.user_id = u.id
     WHERE o.id = ?`,
    [orderId]
  );
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const [items] = await Order.findItemsByOrder(orderId);

  const emailTo = order.customer_email || order.u_email;
  if (!emailTo) return res.status(400).json({ error: 'No email address for this order' });

  const html = buildReceiptHTML({
    id: order.id,
    customer_name: order.customer_name || order.u_name || 'Customer',
    customer_email: emailTo,
    customer_phone: order.customer_phone || '',
    customer_address: order.customer_address || '',
    payment_method: order.payment_method || 'cod',
    payment_status: order.payment_status || 'pending',
    total: order.total,
    items,
    created_at: order.created_at,
  });

  await resend.emails.send({
    from: `Samuel Store <${process.env.MAIL_FROM || 'no-reply@samuelstore.com'}>`,
    to: emailTo,
    subject: `🧾 Your Receipt — ${fmtOrderId(order.id, order.created_at)} | Samuel Store`,
    html,
  });

  res.json({ message: `Receipt resent to ${emailTo}` });
});

module.exports = { placeOrder, getUserOrders, resendReceipt };
