import { Router } from "express";
import { SavedJobsController } from "../modules/savedJobs/savedJobs.controller";
import { SavedJobsService } from "../modules/savedJobs/savedJobs.service";

const router = Router();
const service = new SavedJobsService();
const controller = new SavedJobsController(service);

router.get("/", (req, res) => controller.getAll(req, res));
router.get("/:id", (req, res) => controller.getById(req, res));
router.post("/", (req, res) => controller.create(req, res));
router.patch("/:id", (req, res) => controller.update(req, res));
router.delete("/:id", (req, res) => controller.delete(req, res));

export { router as savedJobsRoutes };
