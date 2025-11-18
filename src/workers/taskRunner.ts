import { Repository } from 'typeorm';
import { Task } from '../models/Task';
import { getJobForTaskType } from '../jobs/JobFactory';
import {WorkflowStatus} from "../workflows/WorkflowFactory";
import {Workflow} from "../models/Workflow";
import {Result} from "../models/Result";

export enum TaskStatus {
    Queued = 'queued',
    InProgress = 'in_progress',
    Completed = 'completed',
    Failed = 'failed',
    Waiting = 'waiting'
}

export class TaskRunner {
    constructor(
        private taskRepository: Repository<Task>,
    ) {}

    private async checkDependency(task: Task): Promise<boolean> {
        if (!task.dependencyStepNumber){
            return false;
        }

        const dependencyTask = await this.taskRepository.findOne({
            where: {
                workflow: { workflowId: task.workflow.workflowId },
                stepNumber: task.dependencyStepNumber
            }
        });

        if (!dependencyTask || dependencyTask.status === TaskStatus.Completed) {
            return false;
        }

        console.log(`Task ${task.taskId} waiting for dependency step ${task.dependencyStepNumber}`);
        if (task.status !== TaskStatus.Waiting) {
            task.status = TaskStatus.Waiting;
            await this.taskRepository.save(task);
        }
        return true;
        return true;
    }

    private async updateWorkflowStatus(workflowId: string): Promise<void> {
        const workflowRepository = this.taskRepository.manager.getRepository(Workflow);
        const currentWorkflow = await workflowRepository.findOne({ where: { workflowId }, relations: ['tasks'] });

        if (!currentWorkflow) return;

        const allCompleted = currentWorkflow.tasks.every(t => t.status === TaskStatus.Completed);
        const anyFailed = currentWorkflow.tasks.some(t => t.status === TaskStatus.Failed);

        if (anyFailed) {
            currentWorkflow.status = WorkflowStatus.Failed;
            await workflowRepository.save(currentWorkflow);
            return;
        }

        if (!allCompleted) {
            currentWorkflow.status = WorkflowStatus.InProgress;
            await workflowRepository.save(currentWorkflow);
            return;
        }

        currentWorkflow.status = WorkflowStatus.Completed;
        const results = [];
        const resultRepository = this.taskRepository.manager.getRepository(Result);
        for (const t of currentWorkflow.tasks) {
            if (!t.resultId) continue;

            const result = await resultRepository.findOne({ where: { resultId: t.resultId } });
            if (!result) continue;

            try {
                results.push(JSON.parse(result.data || '{}'));
            } catch (e) {
                results.push(result.data);
            }
        }
        currentWorkflow.finalResult = JSON.stringify(results);

        await workflowRepository.save(currentWorkflow);
    }

    async run(task: Task): Promise<void> {
        const shouldWait = await this.checkDependency(task);
        if (shouldWait) return;

        task.status = TaskStatus.InProgress;
        task.progress = 'starting job...';
        await this.taskRepository.save(task);
        const job = getJobForTaskType(task.taskType);

        try {
            console.log(`Starting job ${task.taskType} for task ${task.taskId}...`);
            const resultRepository = this.taskRepository.manager.getRepository(Result);
            const taskResult = await job.run(task);
            console.log(`Job ${task.taskType} for task ${task.taskId} completed successfully.`);
            const result = new Result();
            result.taskId = task.taskId!;
            result.data = JSON.stringify(taskResult || {});
            await resultRepository.save(result);
            task.resultId = result.resultId!;
            task.status = TaskStatus.Completed;
            task.progress = null;
            await this.taskRepository.save(task);

            const dependentTasks = await this.taskRepository.find({
                where: {
                    workflow: { workflowId: task.workflow.workflowId },
                    dependencyStepNumber: task.stepNumber,
                    status: TaskStatus.Waiting
                }
            });

            for (const depTask of dependentTasks) {
                depTask.status = TaskStatus.Queued;
                await this.taskRepository.save(depTask);
            }

        } catch (error: any) {
            console.error(`Error running job ${task.taskType} for task ${task.taskId}:`, error);

            task.status = TaskStatus.Failed;
            task.progress = null;
            await this.taskRepository.save(task);

            throw error;
        } finally {
            await this.updateWorkflowStatus(task.workflow.workflowId);
        }
    }
}