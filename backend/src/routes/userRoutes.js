const router = require('express').Router();
const userController = require('../controllers/userController');
const { authRequired, requireRole } = require('../middlewares/auth');
router.get('/me', authRequired, userController.getMe);


// Public: view a user's public profile (safe fields only)
router.get('/public/:id', userController.getPublicUser);

// Public: list organizers
router.get('/organizers', userController.listOrganizers);

// Auth: upload avatar
router.post(
  '/me/avatar',
  authRequired,
  requireRole('participant','verified_user','organizer','moderator','admin','super_admin','security_officer','auditor'),
  userController.uploadAvatarSingle,
  userController.uploadAvatar
);

module.exports = router;
