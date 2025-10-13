import express from "express";
import { connectDatabase } from "@/db/MongoDB.js";
import { initServices, initControllers, initRoutes } from "./init/index.js";
import cookieParser from "cookie-parser";
import { addUserContext } from "./middleware/AddUserContext.js";
import { verifyToken } from "./middleware/VerifyToken.js";

const createApp = async () => {
  await connectDatabase();
  const services = await initServices();
  const controllers = initControllers(services);
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  const routes = initRoutes(controllers, app);
  app.use("/api/v1/health", verifyToken, addUserContext, (req, res) => {
    res.json({
      status: "OK",
    });
  });

  const port = 52345;
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
};

createApp();
