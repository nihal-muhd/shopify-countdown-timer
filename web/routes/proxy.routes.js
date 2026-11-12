import { Router } from "express";
import * as proxyController from "../controllers/proxy.controller.js";
import { verifyAppProxy } from "../middleware/verifyAppProxy.js";
import {
  impressionLimiter,
  timerLookupLimiter,
} from "../middleware/rateLimit.js";
import { catchAsyncErrors } from "../middleware/errorHandler.js";

const proxyRouter = Router();

proxyRouter.use(verifyAppProxy);
proxyRouter.get(
  "/timer",
  timerLookupLimiter,
  catchAsyncErrors(proxyController.getTimerForProduct),
);
proxyRouter.post(
  "/impression/:id",
  impressionLimiter,
  catchAsyncErrors(proxyController.recordImpression),
);

export default proxyRouter;
