import { anyString, deepEqual, instance, mock, verify } from 'ts-mockito';

import { SchedulesRepository } from '../../src/repository/SchedulesRepository';
import { JobRepository } from '../../src/repository/JobRepository';
import { MomoOptions, MongoSchedule } from '../../src';

const schedulesRepository = mock(SchedulesRepository);
const disconnect = jest.fn();
jest.mock('../../src/Connection', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Connection: {
      create: async (_options: MomoOptions) => {
        return {
          getJobRepository: () => instance(mock(JobRepository)),
          getSchedulesRepository: () => instance(schedulesRepository),
          disconnect,
        };
      },
    },
  };
});

describe('MongoSchedule', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('connects and starts the ping and disconnects and stops the ping', async () => {
    const mongoSchedule = await MongoSchedule.connect({ scheduleName: 'schedule', url: 'mongodb://does.not/matter' });
    const secondSchedule = await MongoSchedule.connect({
      scheduleName: 'secondSchedule',
      url: 'mongodb://does.not/matter',
    });

    await mongoSchedule.start();
    verify(schedulesRepository.isActiveSchedule('schedule')).once();
    await secondSchedule.start();
    verify(schedulesRepository.isActiveSchedule('secondSchedule')).once();

    await mongoSchedule.disconnect();
    await secondSchedule.disconnect();
    verify(schedulesRepository.deleteOne(deepEqual({ scheduleId: anyString() }))).twice();

    expect(disconnect).toHaveBeenCalledTimes(2);
  });
});
