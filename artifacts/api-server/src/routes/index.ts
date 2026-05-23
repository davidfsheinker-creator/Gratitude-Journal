import { Router, type IRouter } from "express";
import healthRouter from "./health";
import entriesRouter from "./entries";
import streakRouter from "./streak";
import promptsRouter from "./prompts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(entriesRouter);
router.use(streakRouter);
router.use(promptsRouter);

export default router;
