import { DataAnalysisJob } from '../DataAnalysisJob';
import { Task } from '../../models/Task';
import { Feature, Polygon } from 'geojson';

describe('DataAnalysisJob', () => {
  let job: DataAnalysisJob;

  beforeEach(() => {
    job = new DataAnalysisJob();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should find a country when polygon is within a country', async () => {
    const mockTask = {
      taskId: 'test-task-1',
      geoJson: JSON.stringify({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-63.624885, -10.311050],
            [-63.624885, -10.367865],
            [-63.612783, -10.367865],
            [-63.612783, -10.311050],
            [-63.624885, -10.311050]
          ]]
        }
      } as Feature<Polygon>)
    } as Task;

    const result = await job.run(mockTask);

    expect(console.log).toHaveBeenCalledWith('Running data analysis for task test-task-1...');
    expect(typeof result).toBe('string');
    expect(result).not.toBe('No country found');
  });

  it('should return "No country found" when polygon is not within any country', async () => {
    const mockTask = {
      taskId: 'test-task-2',
      geoJson: JSON.stringify({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0]
          ]]
        }
      } as Feature<Polygon>)
    } as Task;

    const result = await job.run(mockTask);

    expect(console.log).toHaveBeenCalledWith('Running data analysis for task test-task-2...');
    expect(result).toBe('No country found');
  });

  it('should handle MultiPolygon geometries in country data', async () => {
    const mockTask = {
      taskId: 'test-task-3',
      geoJson: JSON.stringify({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-63.624885, -10.311050],
            [-63.624885, -10.367865],
            [-63.612783, -10.367865],
            [-63.612783, -10.311050],
            [-63.624885, -10.311050]
          ]]
        }
      } as Feature<Polygon>)
    } as Task;

    const result = await job.run(mockTask);

    expect(result).toBeDefined();
  });

  it('should throw error for invalid JSON', async () => {
    const mockTask = {
      taskId: 'test-task-4',
      geoJson: 'invalid json'
    } as Task;

    await expect(job.run(mockTask)).rejects.toThrow();
  });
});

