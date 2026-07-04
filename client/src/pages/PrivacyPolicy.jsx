export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 760, margin: '48px auto', padding: '0 24px 64px', fontFamily: 'sans-serif', color: '#1a1a2e', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>Privacy Policy</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Last updated: June 2025 &mdash; Samuel Store</p>

      <section style={{ marginBottom: 32 }}>
        <h2>1. What Data We Collect</h2>
        <p>When you register or sign in — including via <strong>Facebook Login</strong> or Google OAuth — we may collect:</p>
        <ul>
          <li>Full name</li>
          <li>Email address</li>
          <li>Facebook ID or Google ID</li>
          <li>Profile picture (avatar)</li>
          <li>Phone number, shipping address (if provided)</li>
          <li>Order history and cart items</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>2. Why We Collect It</h2>
        <ul>
          <li><strong>Authentication</strong> — to verify your identity and keep your account secure</li>
          <li><strong>Account creation</strong> — to create and manage your Samuel Store account</li>
          <li><strong>Order processing</strong> — to fulfil purchases and send order updates</li>
          <li><strong>Communication</strong> — to send transactional emails (OTP codes, order confirmations)</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>3. How Data Is Stored</h2>
        <p>Your data is stored securely in:</p>
        <ul>
          <li><strong>Aiven MySQL 8.4</strong> — cloud-hosted database (Amsterdam, DigitalOcean infrastructure)</li>
          <li><strong>Render</strong> — backend API server hosting</li>
        </ul>
        <p>Passwords are hashed with <strong>bcryptjs</strong> (salt rounds: 10) and are never stored in plain text. JWT tokens expire after 7 days.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>4. Third-Party Login</h2>
        <p>We use <strong>Facebook Login</strong> and <strong>Google OAuth 2.0</strong> to authenticate users securely. When you sign in with Facebook or Google, we receive only the data those services share with us (name, email, profile picture, and provider ID). We do not post to your social accounts or access your friends list.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>5. Data Sharing</h2>
        <p>We do not sell, rent, or share your personal data with third parties, except as required to operate the service (e.g. email delivery via Brevo SMTP) or as required by law.</p>
      </section>

      <section id="data-deletion" style={{ marginBottom: 32 }}>
        <h2>6. Your Rights &amp; Data Deletion</h2>
        <p>You may request deletion of all your personal data at any time. To delete your account and all associated data, send a <code>DELETE</code> request to:</p>
        <pre style={{ background: '#f4f4f8', padding: '12px 16px', borderRadius: 8, overflowX: 'auto' }}>
          DELETE https://samuel-store-server.onrender.com/api/auth/delete-data{'\n'}
          Authorization: Bearer &lt;your_jwt_token&gt;
        </pre>
        <p>This will permanently remove your account, orders, addresses, reviews, and notifications from our database.</p>
        <p>You may also email us at <strong>samuelbondo@example.com</strong> to request manual deletion.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>7. Cookies &amp; Sessions</h2>
        <p>We use <code>localStorage</code> to store your JWT token on the client side. We do not use tracking cookies or third-party advertising cookies.</p>
      </section>

      <section>
        <h2>8. Contact</h2>
        <p>For any privacy-related questions, contact:</p>
        <p><strong>Samuel Bondo</strong><br />UNILAK — Faculty of Computing and Information Sciences<br />Email: samuelbondo@example.com</p>
      </section>
    </div>
  );
}
