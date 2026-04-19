const router = require('express').Router();
const directMessageController = require('../controllers/directMessageController');
const validate = require('../middlewares/validate');
const { authRequired, requireRole } = require('../middlewares/auth');
const { directMessageCreateSchema } = require('../validators/directMessageSchemas');

router.post(
  '/send',
  authRequired,
  requireRole('participant','verified_user','organizer','moderator','admin','super_admin','security_officer','auditor'),
  validate(directMessageCreateSchema),
  directMessageController.create
);

router.get(
  '/inbox',
  authRequired,
  requireRole('participant','verified_user','organizer','moderator','admin','super_admin','security_officer','auditor'),
  directMessageController.inbox
);

module.exports = router;
