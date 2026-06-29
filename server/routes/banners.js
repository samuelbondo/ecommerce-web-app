const router = require('express').Router();
const { getActiveBanners, getAllBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Public — storefront uses this
router.get('/', getActiveBanners);

// Admin only
router.get('/all', authenticate, requireAdmin, getAllBanners);
router.post('/', authenticate, requireAdmin, createBanner);
router.put('/:id', authenticate, requireAdmin, updateBanner);
router.delete('/:id', authenticate, requireAdmin, deleteBanner);

module.exports = router;
