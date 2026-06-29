const router = require('express').Router();
const { getSettings, updateSetting } = require('../controllers/settingsController');

router.get('/', getSettings);
router.put('/', updateSetting);

module.exports = router;
