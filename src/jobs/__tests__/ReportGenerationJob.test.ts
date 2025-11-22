import { ReportGenerationJob } from '../ReportGenerationJob';
import { Task } from '../../models/Task';
import { Workflow } from '../../models/Workflow';
import { Result } from '../../models/Result';
import { AppDataSource } from '../../data-source';
import { WorkflowStatus } from '../../workflows/WorkflowFactory';
import { TaskStatus } from '../../workers/taskRunner';

describe('ReportGenerationJob', () => {
  let job: ReportGenerationJob;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(() => {
    job = new ReportGenerationJob();
  });

  it('should generate report with all task outputs', async () => {
    const workflowRepo = AppDataSource.getRepository(Workflow);
    const taskRepo = AppDataSource.getRepository(Task);
    const resultRepo = AppDataSource.getRepository(Result);

    // Create workflow
    const workflow = new Workflow();
    workflow.clientId = 'test-client';
    workflow.status = WorkflowStatus.InProgress;
    await workflowRepo.save(workflow);

    // Create first task with result
    const task1 = new Task();
    task1.clientId = 'test-client';
    task1.geoJson = '{}';
    task1.status = TaskStatus.Completed;
    task1.taskType = 'polygonArea';
    task1.stepNumber = 1;
    task1.workflow = workflow;
    await taskRepo.save(task1);

    const result1 = new Result();
    result1.taskId = task1.taskId;
    result1.data = JSON.stringify({ area: 1000, unit: 'square meters' });
    await resultRepo.save(result1);

    task1.resultId = result1.resultId;
    await taskRepo.save(task1);

    // Create report task
    const reportTask = new Task();
    reportTask.clientId = 'test-client';
    reportTask.geoJson = '{}';
    reportTask.status = TaskStatus.InProgress;
    reportTask.taskType = 'report';
    reportTask.stepNumber = 2;
    reportTask.workflow = workflow;
    reportTask.taskId = 'report-task-id';
    await taskRepo.save(reportTask);

    // Run the job
    const report = await job.run(reportTask);

    // Verify report structure
    expect(report).toHaveProperty('workflowId', workflow.workflowId);
    expect(report).toHaveProperty('generatedAt');
    expect(report).toHaveProperty('tasks');
    expect(report).toHaveProperty('summary');

    // Verify tasks array
    expect(report.tasks).toHaveLength(1);
    expect(report.tasks[0]).toMatchObject({
      taskId: task1.taskId,
      stepNumber: 1,
      type: 'polygonArea',
      status: TaskStatus.Completed,
      output: { area: 1000, unit: 'square meters' }
    });

    // Cleanup
    await resultRepo.delete(result1.resultId);
    await taskRepo.delete(task1.taskId);
    await taskRepo.delete(reportTask.taskId);
    await workflowRepo.delete(workflow.workflowId);
  });

  it('should handle workflow with no completed tasks', async () => {
    const workflowRepo = AppDataSource.getRepository(Workflow);
    const taskRepo = AppDataSource.getRepository(Task);

    const workflow = new Workflow();
    workflow.clientId = 'test-client';
    workflow.status = WorkflowStatus.InProgress;
    await workflowRepo.save(workflow);

    const reportTask = new Task();
    reportTask.clientId = 'test-client';
    reportTask.geoJson = '{}';
    reportTask.status = TaskStatus.InProgress;
    reportTask.taskType = 'report';
    reportTask.stepNumber = 1;
    reportTask.workflow = workflow;
    reportTask.taskId = 'report-only-task';
    await taskRepo.save(reportTask);

    const report = await job.run(reportTask);

    expect(report.tasks).toHaveLength(0);
    expect(report.summary).toContain('0 tasks processed');

    await taskRepo.delete(reportTask.taskId);
    await workflowRepo.delete(workflow.workflowId);
  });
});
