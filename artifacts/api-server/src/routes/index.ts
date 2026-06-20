import { Router, type IRouter } from "express";
import healthRouter from "./health";
import propertiesRouter from "./properties";
import postsRouter from "./posts";
import generateRouter from "./generate";
import analysisRouter from "./analysis";
import campaignsRouter from "./campaigns";
import dashboardRouter from "./dashboard";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(propertiesRouter);
router.use(postsRouter);
router.use(generateRouter);
router.use(analysisRouter);
router.use(campaignsRouter);
router.use(dashboardRouter);
router.use(storageRouter);

export default router;
