import { Router } from "express";
import territories from "./territories.routes.ts";
import admin from "./admin.routes.ts";
import auth from "./auth.routes.ts";

const router = Router();

router.use("/auth", auth);
router.use("/territories", territories);
router.use("/admin", admin);

export default router;
