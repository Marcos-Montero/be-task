import "reflect-metadata";
import express from "express";
import analysisRoutes from "./routes/analysisRoutes";
import workflowRoutes from "./routes/workflowRoutes";
import defaultRoute from "./routes/defaultRoute";
import { taskWorker } from "./workers/taskWorker";
import { AppDataSource } from "./data-source"; // Import the DataSource instance

const app = express();
app.use(express.json());
app.use("/analysis", analysisRoutes);
app.use("/workflow", workflowRoutes);
app.use("/", defaultRoute);

AppDataSource.initialize()
  .then(() => {
    // Start the worker after successful DB connection
    taskWorker();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => console.log(error));
