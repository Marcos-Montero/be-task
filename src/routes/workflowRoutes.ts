import { Router, RequestHandler } from 'express';
import { AppDataSource } from '../data-source';
import { Workflow } from '../models/Workflow';
import { Task } from '../models/Task';
import { TaskStatus } from '../workers/taskRunner';
import { WorkflowStatus } from '../workflows/WorkflowFactory';

const router = Router();


const getStatus: RequestHandler = async (req, res, next) => {
    const { id } = req.params;
    const workflowRepository = AppDataSource.getRepository(Workflow);
    const taskRepository = AppDataSource.getRepository(Task);

    try {
        const workflow = await workflowRepository.findOne({ where: { workflowId: id } });

        if (!workflow) {
            res.status(404).json({ message: 'Workflow not found' });
            return;
        }

        const tasks = await taskRepository.find({ where: { workflow: { workflowId: id } } });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === TaskStatus.Completed).length;

        res.json({
            workflowId: workflow.workflowId,
            status: workflow.status,
            completedTasks,
            totalTasks
        });
    } catch (error) {
        console.error('Error fetching workflow status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

router.get('/:id/status', getStatus);


const getResults: RequestHandler = async (req, res, next) => {
    const { id } = req.params;
    const workflowRepository = AppDataSource.getRepository(Workflow);

    try {
        const workflow = await workflowRepository.findOne({ where: { workflowId: id } });

        if (!workflow) {
            res.status(404).json({ message: 'Workflow not found' });
            return;
        }

        if (workflow.status !== WorkflowStatus.Completed) {
            res.status(400).json({ message: 'Workflow is not yet completed' });
            return;
        }

        let finalResult = null;
        if (workflow.finalResult) {
            try {
                finalResult = JSON.parse(workflow.finalResult);
            } catch (e) {
                finalResult = workflow.finalResult;
            }
        }

        res.json({
            workflowId: workflow.workflowId,
            status: workflow.status,
            finalResult
        });
    } catch (error) {
        console.error('Error fetching workflow results:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

router.get('/:id/results', getResults);

export default router;
