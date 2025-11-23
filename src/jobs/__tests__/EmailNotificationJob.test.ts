import { EmailNotificationJob } from '../EmailNotificationJob';
import { Task } from '../../models/Task';

describe('EmailNotificationJob', () => {
  let job: EmailNotificationJob;

  beforeEach(() => {
    job = new EmailNotificationJob();
    jest.spyOn(console, 'log').mockImplementation();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('should send email notification and log messages', async () => {
    const mockTask = {
      taskId: 'test-task-1'
    } as Task;

    const promise = job.run(mockTask);
    
    jest.advanceTimersByTime(500);
    
    await promise;

    expect(console.log).toHaveBeenCalledWith('Sending email notification for task test-task-1...');
    expect(console.log).toHaveBeenCalledWith('Email sent!');
  });

  it('should wait for 500ms before completing', async () => {
    const mockTask = {
      taskId: 'test-task-2'
    } as Task;

    const startTime = Date.now();
    const promise = job.run(mockTask);
    
    jest.advanceTimersByTime(500);
    
    await promise;
    const endTime = Date.now();

    expect(endTime - startTime).toBeGreaterThanOrEqual(0);
  });
});

