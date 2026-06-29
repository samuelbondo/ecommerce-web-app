const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Product = require('../models/productModel');

const getProducts = asyncHandler(async (req, res) => {
  const [rows] = await Product.findAll();
  res.json(rows);
});

const getProduct = asyncHandler(async (req, res, next) => {
  const [rows] = await Product.findById(req.params.id);
  if (!rows.length) return next(new AppError('Product not found', 404));
  res.json(rows[0]);
});

module.exports = { getProducts, getProduct };
