const router = require('express').Router();
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { authRequired } = require('../middlewares/auth');
const { loginSchema, registerSchema, sendVerificationCodeSchema, verifyAndRegisterSchema } = require('../validators/authSchemas');

router.post('/login', validate(loginSchema), authController.login);
router.post('/register', validate(registerSchema), authController.register);
router.post('/send-verification-code', validate(sendVerificationCodeSchema), authController.sendVerificationCode);
router.post('/verify-and-register', validate(verifyAndRegisterSchema), authController.verifyAndRegister);
router.get('/me', authRequired, authController.me);

module.exports = router;
