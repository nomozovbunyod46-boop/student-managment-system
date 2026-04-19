const router = require('express').Router();
const supportController = require('../controllers/supportController');
const validate = require('../middlewares/validate');
const { supportCreateSchema } = require('../validators/supportSchemas');

router.post('/', validate(supportCreateSchema), supportController.create);

module.exports = router;
