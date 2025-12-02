// src/routes/territories.routes.ts
import { Router } from "express";
import { authenticateToken, requireAuth } from "../middlewares/auth.ts";
import * as C from "../controllers/territory.controller.ts";

const r = Router();
r.use(authenticateToken, requireAuth);

// 创建申请（需要你审批）
r.post("/apply", C.apply);

// 领地公共池：捐献额度
r.post("/:id/contribute", C.contribute);

// 提案：消费额度 / 加人 / 踢人
r.post("/:id/proposals/spend", C.proposeSpend);
r.post("/:id/proposals/join", C.proposeJoin);
r.post("/:id/proposals/expel", C.proposeExpel);

// 对提案投票
r.post("/proposals/:proposalId/vote", C.vote);

export default r;
