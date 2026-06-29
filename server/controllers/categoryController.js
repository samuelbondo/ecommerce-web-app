const asyncHandler = require('../utils/asyncHandler');
const Category = require('../models/categoryModel');

const getCategories = asyncHandler(async (req, res) => {
  const [rows] = await Category.findAll();
  res.json(rows);
});

module.exports = { getCategories };
