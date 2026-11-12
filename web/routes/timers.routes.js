import { Router } from "express";
import * as timersController from "../controllers/timers.controller.js";
import { validateBody } from "../middleware/validate.js";
import { catchAsyncErrors } from "../middleware/errorHandler.js";
import { timerInputSchema } from "../validators/timer.schema.js";

const timersRouter = Router();

timersRouter.get("/", catchAsyncErrors(timersController.listTimers));
timersRouter.get("/:id", catchAsyncErrors(timersController.getTimer));
timersRouter.post(
  "/",
  validateBody(timerInputSchema),
  catchAsyncErrors(timersController.createTimer),
);
timersRouter.put(
  "/:id",
  validateBody(timerInputSchema),
  catchAsyncErrors(timersController.updateTimer),
);
timersRouter.delete("/:id", catchAsyncErrors(timersController.deleteTimer));

export default timersRouter;
