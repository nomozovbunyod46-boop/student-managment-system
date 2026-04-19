jest.mock('../src/config/db', () => ({
  withTransaction: jest.fn()
}));

jest.mock('../src/repositories/eventRepo', () => ({
  getEventById: jest.fn(),
  getParticipant: jest.fn(),
  countParticipants: jest.fn(),
  getPromoByCode: jest.fn(),
  addParticipantWithTicket: jest.fn(),
  incrementPromoUsage: jest.fn(),
  getWaitlistEntry: jest.fn(),
  markWaitlistAccepted: jest.fn()
}));

const eventService = require('../src/services/eventService');
const eventRepo = require('../src/repositories/eventRepo');
const { withTransaction } = require('../src/config/db');

describe('eventService promo usage transactions', () => {
  const conn = { query: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    withTransaction.mockImplementation(async (fn) => fn(conn));
  });

  test('join() rolls back via transaction when promo limit reached', async () => {
    eventRepo.getEventById.mockResolvedValue({ id: 10, organizer_id: 99, capacity: null });
    eventRepo.getParticipant.mockResolvedValue(null);
    eventRepo.countParticipants.mockResolvedValue(0);
    eventRepo.getPromoByCode.mockResolvedValue({ id: 7, active: 1, usage_limit: 1, used_count: 0 });
    eventRepo.addParticipantWithTicket.mockResolvedValue(1);
    eventRepo.incrementPromoUsage.mockResolvedValue(0);

    await expect(
      eventService.join(10, { id: 42, role: 'participant' }, { promo_code: 'SAVE10' })
    ).rejects.toThrow('Promo code limit reached');

    expect(withTransaction).toHaveBeenCalledTimes(1);
    expect(eventRepo.addParticipantWithTicket).toHaveBeenCalledWith(
      10,
      42,
      expect.any(String),
      'SAVE10',
      conn
    );
    expect(eventRepo.incrementPromoUsage).toHaveBeenCalledWith(7, conn);
  });

  test('acceptWaitlist() rolls back via transaction when promo limit reached', async () => {
    eventRepo.getEventById.mockResolvedValue({ id: 10, organizer_id: 99, capacity: null });
    eventRepo.getParticipant.mockResolvedValue(null);
    eventRepo.getWaitlistEntry.mockResolvedValue({ user_id: 77, status: 'waiting', promo_code: 'SAVE10' });
    eventRepo.countParticipants.mockResolvedValue(0);
    eventRepo.getPromoByCode.mockResolvedValue({ id: 8, active: 1, usage_limit: 1, used_count: 0 });
    eventRepo.addParticipantWithTicket.mockResolvedValue(1);
    eventRepo.incrementPromoUsage.mockResolvedValue(0);

    await expect(
      eventService.acceptWaitlist(10, 77, { id: 99, role: 'admin' })
    ).rejects.toThrow('Promo code limit reached');

    expect(withTransaction).toHaveBeenCalledTimes(1);
    expect(eventRepo.addParticipantWithTicket).toHaveBeenCalledWith(
      10,
      77,
      expect.any(String),
      'SAVE10',
      conn
    );
    expect(eventRepo.incrementPromoUsage).toHaveBeenCalledWith(8, conn);
    expect(eventRepo.markWaitlistAccepted).not.toHaveBeenCalled();
  });
});
