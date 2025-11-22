import request from 'supertest';
import express from 'express';
import workflowRoutes from '../workflowRoutes';
import { AppDataSource } from '../../data-source';
import { Workflow } from '../../models/Workflow';
import { Task } from '../../models/Task';
import { WorkflowStatus } from '../../workflows/WorkflowFactory';
import { TaskStatus } from '../../workers/taskRunner';

const app = express();
app.use(express.json());
app.use('/workflow', workflowRoutes);

describe('Workflow Routes', () => {
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

  describe('GET /workflow/:id/status', () => {
    it('should return workflow status', async () => {
      const workflowRepo = AppDataSource.getRepository(Workflow);
      const taskRepo = AppDataSource.getRepository(Task);

      const workflow = new Workflow();
      workflow.clientId = 'test-client';
      workflow.status = WorkflowStatus.InProgress;
      await workflowRepo.save(workflow);

      const task = new Task();
      task.clientId = 'test-client';
      task.geoJson = '{}';
      task.status = TaskStatus.Completed;
      task.taskType = 'test';
      task.stepNumber = 1;
      task.workflow = workflow;
      await taskRepo.save(task);

      const response = await request(app)
        .get(`/workflow/${workflow.workflowId}/status`)
        .expect(200);

      expect(response.body).toHaveProperty('workflowId', workflow.workflowId);
      expect(response.body).toHaveProperty('status', WorkflowStatus.InProgress);
      expect(response.body).toHaveProperty('completedTasks', 1);
      expect(response.body).toHaveProperty('totalTasks', 1);

      await taskRepo.delete(task.taskId);
      await workflowRepo.delete(workflow.workflowId);
    });

    it('should return 404 for non-existent workflow', async () => {
      const response = await request(app)
        .get('/workflow/non-existent-id/status')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Workflow not found');
    });
  });

  describe('GET /workflow/:id/results', () => {
    it('should return final results for completed workflow', async () => {
      const workflowRepo = AppDataSource.getRepository(Workflow);

      const workflow = new Workflow();
      workflow.clientId = 'test-client';
      workflow.status = WorkflowStatus.Completed;
      workflow.finalResult = JSON.stringify([{ test: 'data' }]);
      await workflowRepo.save(workflow);

      const response = await request(app)
        .get(`/workflow/${workflow.workflowId}/results`)
        .expect(200);

      expect(response.body).toHaveProperty('workflowId', workflow.workflowId);
      expect(response.body).toHaveProperty('status', WorkflowStatus.Completed);
      expect(response.body.finalResult).toEqual([{ test: 'data' }]);

      await workflowRepo.delete(workflow.workflowId);
    });

    it('should return 400 for incomplete workflow', async () => {
      const workflowRepo = AppDataSource.getRepository(Workflow);

      const workflow = new Workflow();
      workflow.clientId = 'test-client';
      workflow.status = WorkflowStatus.InProgress;
      await workflowRepo.save(workflow);

      const response = await request(app)
        .get(`/workflow/${workflow.workflowId}/results`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Workflow is not yet completed');

      await workflowRepo.delete(workflow.workflowId);
    });
  });
});
