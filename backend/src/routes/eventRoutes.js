const router = require('express').Router();
const eventController = require('../controllers/eventController');
const uploadController = require('../controllers/uploadController');
const validate = require('../middlewares/validate');
const { authRequired, requireRole } = require('../middlewares/auth');
const { createEventSchema, updateEventSchema } = require('../validators/eventSchemas');

router.get('/', eventController.list);

// ✅ Upload event images - /:id dan OLDIN bo'lishi kerak (Express route matching)
router.post(
  '/upload-images',
  authRequired,
  requireRole('organizer', 'admin', 'super_admin'),
  uploadController.uploadEventImagesMulti,
  uploadController.uploadEventImages
);

router.get('/:id', eventController.get);

// ✅ views +1 (event detail ochilganda chaqirasan)
router.patch('/:id/view', authRequired, requireRole('participant', 'verified_user', 'organizer', 'admin', 'super_admin'), eventController.view);

// ✅ join event (participants) + promo_code (optional) + waitlist (capacity bo‘lsa)
router.post('/:id/join', authRequired, requireRole('participant', 'verified_user', 'organizer', 'admin', 'super_admin'), eventController.join);

// ✅ participant o‘z ticketini ko‘rish (QR)
router.get('/:id/my-ticket', authRequired, requireRole('participant', 'verified_user', 'organizer', 'admin', 'super_admin'), eventController.myTicket);

// ✅ organizer/admin: participants + check-in
router.get('/:id/participants', authRequired, requireRole('organizer', 'admin', 'super_admin'), eventController.participants);
router.post('/:id/checkin', authRequired, requireRole('organizer', 'admin', 'super_admin'), eventController.checkin);

// ✅ organizer/admin: waitlist
router.get('/:id/waitlist', authRequired, requireRole('organizer', 'admin', 'super_admin'), eventController.waitlist);
router.post('/:id/waitlist/accept', authRequired, requireRole('organizer', 'admin', 'super_admin'), eventController.acceptWaitlist);

// ✅ organizer/admin: promo codes
router.get('/:id/promo-codes', authRequired, requireRole('organizer', 'admin', 'super_admin'), eventController.promoList);
router.post('/:id/promo-codes', authRequired, requireRole('organizer', 'admin', 'super_admin'), eventController.promoCreate);

router.post('/', authRequired, requireRole('organizer', 'admin', 'super_admin'), validate(createEventSchema), eventController.create);

router.put('/:id', authRequired, requireRole('organizer', 'admin', 'super_admin'), validate(updateEventSchema), eventController.update);
router.delete('/:id', authRequired, requireRole('organizer', 'admin', 'super_admin'), eventController.remove);

module.exports = router;
