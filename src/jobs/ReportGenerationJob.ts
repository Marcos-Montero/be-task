import { Job } from './Job';
import { Task } from '../models/Task';
import { AppDataSource } from '../data-source';
import { Result } from '../models/Result';

export class ReportGenerationJob implements Job {
    async run(task: Task): Promise<any> {
        try {
            const taskRepository = AppDataSource.getRepository(Task);
            const resultRepository = AppDataSource.getRepository(Result);

            const currentTask = await taskRepository.findOne({
                where: { taskId: task.taskId },
                relations: ['workflow']
            });

            if (!currentTask || !currentTask.workflow) {
                throw new Error('Workflow not found for this task');
            }

            const workflowId = currentTask.workflow.workflowId;

            const workflowTasks = await taskRepository.find({
                where: { workflow: { workflowId: workflowId } },
                order: { stepNumber: 'ASC' }
            });

            const tasksData = [];

            for (const t of workflowTasks) {
                if (t.taskId === task.taskId) continue;

                let output = null;
                if (t.resultId) {
                    const result = await resultRepository.findOne({ where: { resultId: t.resultId } });
                    if (result && result.data) {
                        try {
                            output = JSON.parse(result.data);
                        } catch (e) {
                            output = result.data;
                        }
                    }
                }

                tasksData.push({
                    taskId: t.taskId,
                    stepNumber: t.stepNumber,
                    type: t.taskType,
                    status: t.status,
                    output: output
                });
            }

            return {
                workflowId: workflowId,
                generatedAt: new Date().toISOString(),
                tasks: tasksData,
                summary: `Report generated for workflow ${workflowId} with ${tasksData.length} tasks processed.`
            };

        } catch (error: any) {
            throw new Error(`Failed to generate report: ${error.message}`);
        }
    }
}
