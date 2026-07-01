require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('./config/passport');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/ai', require('./routes/ai'));

app.get('/', (req, res) => {
  res.json({ message: 'Samuel Store API is running' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
