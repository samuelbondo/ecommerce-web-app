const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Product = require('../models/productModel');

const getProducts = asyncHandler(async (req, res) => {
  const [rows] = await Product.findAll();
  for (const p of rows) {
    const [imgs] = await Product.findImages(p.id);
    p.images = imgs;
    const [variants] = await Product.findVariants(p.id);
    p.variants = variants;
    // price range for listing cards
    const prices = variants.map(v => Number(v.price)).filter(v => v > 0);
    p.min_variant_price = prices.length ? Math.min(...prices) : Number(p.price);
    p.max_variant_price = prices.length ? Math.max(...prices) : Number(p.price);
  }
  res.json(rows);
});

const getProduct = asyncHandler(async (req, res, next) => {
  const [rows] = await Product.findById(req.params.id);
  if (!rows.length) return next(new AppError('Product not found', 404));
  const product = rows[0];
  const [images] = await Product.findImages(product.id);
  const [options] = await Product.findOptions(product.id);
  const [variants] = await Product.findVariants(product.id);
  product.images = images;
  product.options = options;
  product.variants = variants;
  res.json(product);
});

module.exports = { getProducts, getProduct };
