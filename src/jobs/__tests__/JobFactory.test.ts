import { getJobForTaskType } from '../JobFactory';
import { DataAnalysisJob } from '../DataAnalysisJob';
import { EmailNotificationJob } from '../EmailNotificationJob';
import { PolygonAreaJob } from '../PolygonAreaJob';
import { ReportGenerationJob } from '../ReportGenerationJob';

describe('JobFactory', () => {
  it('should return DataAnalysisJob for "analysis" task type', () => {
    const job = getJobForTaskType('analysis');
    expect(job).toBeInstanceOf(DataAnalysisJob);
  });

  it('should return EmailNotificationJob for "notification" task type', () => {
    const job = getJobForTaskType('notification');
    expect(job).toBeInstanceOf(EmailNotificationJob);
  });

  it('should return PolygonAreaJob for "polygonArea" task type', () => {
    const job = getJobForTaskType('polygonArea');
    expect(job).toBeInstanceOf(PolygonAreaJob);
  });

  it('should return ReportGenerationJob for "report" task type', () => {
    const job = getJobForTaskType('report');
    expect(job).toBeInstanceOf(ReportGenerationJob);
  });

  it('should throw error for unknown task type', () => {
    expect(() => {
      getJobForTaskType('unknown');
    }).toThrow('No job found for task type: unknown');
  });

  it('should throw error for empty task type', () => {
    expect(() => {
      getJobForTaskType('');
    }).toThrow('No job found for task type: ');
  });
});

