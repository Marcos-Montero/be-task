import { DataSource } from 'typeorm';
import { Task } from './models/Task';
import {Result} from "./models/Result";
import {Workflow} from "./models/Workflow";

export const AppDataSource = new DataSource({
    type: 'better-sqlite3',
    database: 'data/database.sqlite',
    entities: [Task, Result, Workflow],
    synchronize: true,
    logging: false,
});
