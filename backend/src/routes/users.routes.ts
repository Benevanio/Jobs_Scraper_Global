import { Router } from "express";
import { UsersController } from "../modules/users/users.controller";
import { UsersService } from "../modules/users/users.service";

const router = Router();
const usersService = new UsersService();
const usersController = new UsersController(usersService);

router.get("/profile", (req, res) => usersController.getProfile(req, res));
router.patch("/profile", (req, res) => usersController.updateProfile(req, res));
router.get("/preferences", (req, res) =>
  usersController.getPreferences(req, res),
);
router.post("/preferences", (req, res) =>
  usersController.createPreferences(req, res),
);
router.patch("/preferences", (req, res) =>
  usersController.updatePreferences(req, res),
);

export { router as userRoutes };
