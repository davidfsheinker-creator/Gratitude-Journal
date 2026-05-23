import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import entriesRouter from "./entries";
import streakRouter from "./streak";
import promptsRouter from "./prompts";
import settingsRouter from "./settings";
import quotesRouter from "./quotes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(entriesRouter);
router.use(streakRouter);
router.use(promptsRouter);
router.use(settingsRouter);
router.use(quotesRouter);

export default router;
