const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const getActiveBanners = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC'
  );
  res.json(rows);
});

const getAllBanners = asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM banners ORDER BY sort_order ASC');
  res.json(rows);
});

const createBanner = asyncHandler(async (req, res) => {
  const { title, subtitle, cta_text, cta_link, image_url, overlay_opacity, sort_order } = req.body;
  if (!image_url) return next(new AppError('image_url is required', 400));
  const [r] = await db.query(
    'INSERT INTO banners (title, subtitle, cta_text, cta_link, image_url, overlay_opacity, sort_order) VALUES (?,?,?,?,?,?,?)',
    [title, subtitle, cta_text || 'Shop Now', cta_link || '/products', image_url, overlay_opacity || 0.45, sort_order || 0]
  );
  res.status(201).json({ id: r.insertId, message: 'Banner created' });
});

const updateBanner = asyncHandler(async (req, res) => {
  const { title, subtitle, cta_text, cta_link, image_url, overlay_opacity, sort_order, is_active } = req.body;
  await db.query(
    'UPDATE banners SET title=?, subtitle=?, cta_text=?, cta_link=?, image_url=?, overlay_opacity=?, sort_order=?, is_active=? WHERE id=?',
    [title, subtitle, cta_text, cta_link, image_url, overlay_opacity, sort_order, is_active, req.params.id]
  );
  res.json({ message: 'Banner updated' });
});

const deleteBanner = asyncHandler(async (req, res) => {
  await db.query('DELETE FROM banners WHERE id=?', [req.params.id]);
  res.json({ message: 'Banner deleted' });
});

module.exports = { getActiveBanners, getAllBanners, createBanner, updateBanner, deleteBanner };
