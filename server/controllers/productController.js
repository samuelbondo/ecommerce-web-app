const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Product = require('../models/productModel');

const getProducts = asyncHandler(async (req, res) => {
  const [rows] = await Product.findAll();
  // Attach primary image and variants count for listing (lightweight)
  for (const p of rows) {
    const [imgs] = await Product.findImages(p.id);
    p.images = imgs;
    const [variants] = await Product.findVariants(p.id);
    p.variants = variants;
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
