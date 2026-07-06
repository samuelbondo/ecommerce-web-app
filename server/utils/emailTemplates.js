/**
 * Samuel Store — Email Templates
 * Generates branded HTML receipt emails for order confirmation.
 * Used by orderController (on placement) and admin resend endpoint.
 */

/**
 * @param {object} order
 * @param {string} order.id
 * @param {string} order.customer_name
 * @param {string} order.customer_email
 * @param {string} order.customer_phone
 * @param {string} order.customer_address
 * @param {string} order.payment_method  — 'cod' | 'paypal' | etc.
 * @param {string} order.payment_status  — 'pending' | 'paid'
 * @param {number} order.total
 * @param {Array}  order.items           — [{ name, variant_name, quantity, price }]
 * @param {string} order.created_at
 * @param {string} order.extraNote    — (optional) extra message shown at top of email
 * @returns {string} HTML string
 */
function buildReceiptHTML(order) {
  const paymentLabel = {
    cod: '💵 Cash on Delivery',
    paypal: '💳 PayPal',
    stripe: '💳 Card (Stripe)',
    momo: '📱 Mobile Money',
  }[order.payment_method] || order.payment_method;

  const paymentStatusBadge =
    order.payment_status === 'paid'
      ? `<span style="background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:20px;font-size:0.78rem;font-weight:700;">✅ Paid</span>`
      : `<span style="background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:20px;font-size:0.78rem;font-weight:700;">⏳ Payment Pending</span>`;

  const itemRows = (order.items || [])
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:0.88rem;color:#333;">
          ${i.name}${i.variant_name ? ` <span style="color:#e94560;font-size:0.78rem;">(${i.variant_name})</span>` : ''}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:0.88rem;color:#555;">${i.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:0.88rem;color:#555;">$${Number(i.price).toFixed(2)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:0.88rem;font-weight:600;color:#1a1a2e;">$${(i.price * i.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const date = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Order Receipt #${order.id} — Samuel Store</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;">
            <div style="display:inline-block;background:#e94560;color:#fff;font-weight:800;font-size:1.4rem;padding:10px 22px;border-radius:10px;letter-spacing:1px;">
              Samuel Store
            </div>
            <p style="color:#a0aec0;margin:12px 0 0;font-size:0.85rem;letter-spacing:2px;text-transform:uppercase;">Order Confirmation</p>
          </td>
        </tr>

        <!-- Extra Note (cancellation, etc.) -->
        ${order.extraNote ? `
        <tr>
          <td style="padding:0 40px 0;">
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 18px;margin-bottom:8px;">
              <div style="font-size:0.85rem;color:#dc2626;font-weight:600;">${order.extraNote}</div>
            </div>
          </td>
        </tr>` : ''}

        <!-- Success Banner -->
        <tr>
          <td style="background:#f0fdf4;padding:20px 40px;text-align:center;border-bottom:1px solid #dcfce7;">
            <div style="font-size:2rem;">✅</div>
            <h2 style="margin:8px 0 4px;color:#065f46;font-size:1.1rem;">Your order has been placed!</h2>
            <p style="margin:0;color:#6b7280;font-size:0.88rem;">Thank you, <strong>${order.customer_name}</strong>. We've received your order and will process it shortly.</p>
          </td>
        </tr>

        <!-- Order Meta -->
        <tr>
          <td style="padding:28px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:50%;padding-bottom:16px;">
                  <div style="font-size:0.72rem;color:#aaa;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Order ID</div>
                  <div style="font-size:1rem;font-weight:800;color:#e94560;">#${order.id}</div>
                </td>
                <td style="width:50%;padding-bottom:16px;text-align:right;">
                  <div style="font-size:0.72rem;color:#aaa;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Date</div>
                  <div style="font-size:0.88rem;color:#333;">${date}</div>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:16px;">
                  <div style="font-size:0.72rem;color:#aaa;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Email</div>
                  <div style="font-size:0.88rem;color:#333;">${order.customer_email || '—'}</div>
                </td>
                <td style="padding-bottom:16px;text-align:right;">
                  <div style="font-size:0.72rem;color:#aaa;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Phone</div>
                  <div style="font-size:0.88rem;color:#333;">${order.customer_phone || '—'}</div>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-bottom:16px;">
                  <div style="font-size:0.72rem;color:#aaa;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Delivery Address</div>
                  <div style="font-size:0.88rem;color:#333;">${order.customer_address || '—'}</div>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:8px;">
                  <div style="font-size:0.72rem;color:#aaa;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Payment Method</div>
                  <div style="font-size:0.88rem;color:#333;">${paymentLabel}</div>
                </td>
                <td style="padding-bottom:8px;text-align:right;">
                  <div style="font-size:0.72rem;color:#aaa;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Payment Status</div>
                  ${paymentStatusBadge}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #f0f0f0;margin:16px 0;"/></td></tr>

        <!-- Items Table -->
        <tr>
          <td style="padding:0 40px 24px;">
            <div style="font-size:0.8rem;font-weight:700;color:#1a1a2e;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Order Items</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:10px;overflow:hidden;">
              <thead>
                <tr style="background:#f8f9fb;">
                  <th style="padding:10px 12px;text-align:left;font-size:0.72rem;color:#888;font-weight:700;text-transform:uppercase;">Product</th>
                  <th style="padding:10px 12px;text-align:center;font-size:0.72rem;color:#888;font-weight:700;text-transform:uppercase;">Qty</th>
                  <th style="padding:10px 12px;text-align:right;font-size:0.72rem;color:#888;font-weight:700;text-transform:uppercase;">Unit</th>
                  <th style="padding:10px 12px;text-align:right;font-size:0.72rem;color:#888;font-weight:700;text-transform:uppercase;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
              <tfoot>
                <tr style="background:#f8f9fb;">
                  <td colspan="3" style="padding:12px;text-align:right;font-size:0.88rem;font-weight:700;color:#1a1a2e;">Grand Total</td>
                  <td style="padding:12px;text-align:right;font-size:1rem;font-weight:800;color:#e94560;">$${Number(order.total).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </td>
        </tr>

        <!-- COD Note (only for COD + pending) -->
        ${order.payment_method === 'cod' && order.payment_status !== 'paid' ? `
        <tr>
          <td style="padding:0 40px 24px;">
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;">
              <div style="font-size:0.82rem;color:#92400e;font-weight:600;">💵 Cash on Delivery</div>
              <div style="font-size:0.8rem;color:#a16207;margin-top:4px;">Please have the exact amount of <strong>$${Number(order.total).toFixed(2)}</strong> ready when your order arrives. Payment is collected at the door.</div>
            </div>
          </td>
        </tr>` : ''}

        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fb;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0;">
            <p style="margin:0 0 8px;font-size:0.82rem;color:#888;">Questions? Reply to this email or contact us at <a href="mailto:support@samuelstore.com" style="color:#e94560;text-decoration:none;">support@samuelstore.com</a></p>
            <p style="margin:0;font-size:0.75rem;color:#bbb;">© ${new Date().getFullYear()} Samuel Store · UNILAK E-Commerce Project</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

module.exports = { buildReceiptHTML };
