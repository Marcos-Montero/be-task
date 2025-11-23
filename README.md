# Backend Coding Challenge

## Getting Started

1. Fork the Project:
   ![There is a button on the top right of you codesandbox environment after signing in](public/image.png)
2. Start Coding

This repository demonstrates a backend architecture that handles asynchronous tasks, workflows, and job execution using TypeScript, Express.js, and TypeORM. The project showcases how to:

- Define and manage entities such as `Task` and `Workflow`.
- Use a `WorkflowFactory` to create workflows from YAML configurations.
- Implement a `TaskRunner` that executes jobs associated with tasks and manages task and workflow states.
- Run tasks asynchronously using a background worker.

## Key Features

1. **Entity Modeling with TypeORM**

   - **Task Entity:** Represents an individual unit of work with attributes like `taskType`, `status`, `progress`, and references to a `Workflow`.
   - **Workflow Entity:** Groups multiple tasks into a defined sequence or steps, allowing complex multi-step processes.

2. **Workflow Creation from YAML**

   - Use `WorkflowFactory` to load workflow definitions from a YAML file.
   - Dynamically create workflows and tasks without code changes by updating YAML files.

3. **Asynchronous Task Execution**

   - A background worker (`taskWorker`) continuously polls for `queued` tasks.
   - The `TaskRunner` runs the appropriate job based on a task’s `taskType`.

4. **Robust Status Management**

   - `TaskRunner` updates the status of tasks (from `queued` to `in_progress`, `completed`, or `failed`).
   - Workflow status is evaluated after each task completes, ensuring you know when the entire workflow is `completed` or `failed`.

5. **Dependency Injection and Decoupling**
   - `TaskRunner` takes in only the `Task` and determines the correct job internally.
   - `TaskRunner` handles task state transitions, leaving the background worker clean and focused on orchestration.

## Project Structure

```
src
├─ models/
│   ├─ world_data.json  # Contains world data for analysis
│
├─ models/
│   ├─ Result.ts        # Defines the Result entity
│   ├─ Task.ts          # Defines the Task entity
│   ├─ Workflow.ts      # Defines the Workflow entity
│
├─ jobs/
│   ├─ Job.ts           # Job interface
│   ├─ JobFactory.ts    # getJobForTaskType function for mapping taskType to a Job
│   ├─ TaskRunner.ts    # Handles job execution & task/workflow state transitions
│   ├─ DataAnalysisJob.ts (example)
│   ├─ EmailNotificationJob.ts (example)
│   ├─ PolygonAreaJob.ts # Calculates polygon area
│   ├─ ReportGenerationJob.ts # Aggregates workflow results
│
├─ workflows/
│   ├─ WorkflowFactory.ts  # Creates workflows & tasks from a YAML definition
│
├─ workers/
│   ├─ taskWorker.ts    # Background worker that fetches queued tasks & runs them
│
├─ routes/
│   ├─ analysisRoutes.ts # POST /analysis endpoint to create workflows
│   ├─ workflowRoutes.ts # GET /workflow/:id/status & /results
│
├─ data-source.ts       # TypeORM DataSource configuration
└─ index.ts             # Express.js server initialization & starting the worker
```

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm or yarn
- SQLite or another supported database

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/backend-coding-challenge.git
   cd backend-coding-challenge
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **🧪 Run Tests**

   The project includes Jest tests for jobs and API endpoints:

   ```bash
   # Run all tests
   npm test

   # Run tests in watch mode
   npm run test:watch
   ```

   **Test Coverage:**
   - Unit tests for `PolygonAreaJob` (valid/invalid GeoJSON, malformed JSON)
   - Unit tests for `ReportGenerationJob` (report generation, empty workflows)
   - Integration tests for workflow API endpoints (status, results, error handling)

4. **Configure TypeORM:**

   - Edit `data-source.ts` to ensure the `entities` array includes `Task` and `Workflow` entities.
   - Confirm database settings (e.g. SQLite file path).

5. **Create or Update the Workflow YAML:**
   - Place a YAML file (e.g. `example_workflow.yml`) in a `workflows/` directory.
   - Define steps, for example:
     ```yaml
     name: "example_workflow"
     steps:
       - taskType: "analysis"
         stepNumber: 1
       - taskType: "notification"
         stepNumber: 2
     ```

### Running the Application

1. **Compile TypeScript (optional if using `ts-node`):**

   ```bash
   npx tsc
   ```

2. **Start the server:**

   ```bash
   npm start
   ```

   If using `ts-node`, this will start the Express.js server and the background worker after database initialization.

3. **Create a Workflow (e.g. via `/analysis`):**

   ```bash
   curl -X POST http://localhost:3000/analysis \
   -H "Content-Type: application/json" \
   -d '{
    "clientId": "client123",
    "geoJson": {
        "type": "Polygon",
        "coordinates": [
            [
                [
                    -63.624885020050996,
                    -10.311050368263523
                ],
                [
                    -63.624885020050996,
                    -10.367865108370523
                ],
                [
                    -63.61278302732815,
                    -10.367865108370523
                ],
                [
                    -63.61278302732815,
                    -10.311050368263523
                ],
                [
                    -63.624885020050996,
                    -10.311050368263523
                ]
            ]
        ]
    }
    }'
   ```

   This will read the configured workflow YAML, create a workflow and tasks, and queue them for processing.

4. **Check Logs:**
   - The worker picks up tasks from `queued` state.
   - `TaskRunner` runs the corresponding job (e.g., data analysis, email notification) and updates states.
   - Once tasks are done, the workflow is marked as `completed`.

### **New Features**

#### **1. Polygon Area Job**
Calculates the area of the provided polygon.
- Task Type: `polygonArea`

#### **2. Report Generation Job**
Aggregates results from all tasks in the workflow.
- Task Type: `report`

#### **3. Interdependent Tasks**
Tasks can depend on previous tasks using `dependsOn`.
Example YAML:
```yaml
steps:
  - taskType: "polygonArea"
    stepNumber: 1
  - taskType: "report"
    stepNumber: 2
    dependsOn: 1
```

#### **4. Workflow Status Endpoint**
Get the status of a workflow.
- **URL:** `/workflow/:id/status`
- **Method:** `GET`

#### **5. Workflow Results Endpoint**
Get the final results of a completed workflow.
- **URL:** `/workflow/:id/results`
- **Method:** `GET`
