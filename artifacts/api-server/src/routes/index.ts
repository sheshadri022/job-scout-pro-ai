import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import resumeRouter from "./resume";
import jobsRouter from "./jobs";
import applicationsRouter from "./applications";
import aiRouter from "./ai";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(resumeRouter);
router.use(jobsRouter);
router.use(applicationsRouter);
router.use(aiRouter);
router.use(dashboardRouter);

export default router;
