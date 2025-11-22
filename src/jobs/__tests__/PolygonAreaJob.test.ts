import { PolygonAreaJob } from '../PolygonAreaJob';
import { Task } from '../../models/Task';

describe('PolygonAreaJob', () => {
  let job: PolygonAreaJob;

  beforeEach(() => {
    job = new PolygonAreaJob();
  });

  it('should calculate area for a valid polygon', async () => {
    const mockTask = {
      geoJson: JSON.stringify({
        type: 'Polygon',
        coordinates: [
          [
            [-63.624885, -10.311050],
            [-63.624885, -10.367865],
            [-63.612783, -10.367865],
            [-63.612783, -10.311050],
            [-63.624885, -10.311050]
          ]
        ]
      })
    } as Task;

    const result = await job.run(mockTask);

    expect(result).toHaveProperty('area');
    expect(result).toHaveProperty('unit');
    expect(result.area).toBeGreaterThan(0);
    expect(result.unit).toBe('square meters');
  });

  it('should throw error for invalid GeoJSON type', async () => {
    const mockTask = {
      geoJson: JSON.stringify({
        type: 'Point',
        coordinates: [-63.624885, -10.311050]
      })
    } as Task;

    await expect(job.run(mockTask)).rejects.toThrow('Invalid GeoJSON type');
  });

  it('should throw error for malformed JSON', async () => {
    const mockTask = {
      geoJson: 'invalid json'
    } as Task;

    await expect(job.run(mockTask)).rejects.toThrow();
  });
});
