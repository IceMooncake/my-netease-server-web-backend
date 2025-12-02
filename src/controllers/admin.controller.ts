// src/controllers/admin.controller.ts
import { Request, Response, NextFunction } from "express";
import * as Apps from "../repositories/applications.repo.ts";
import * as Svc from "../services/territory.service.ts";

export async function listApplications(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.query as any;
    const list = await Apps.listApplications(status);
    res.json(list);
  } catch (e) { next(e); }
}

export async function decideApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = (req as any).user;
    const id = Number(req.params.id);
    const { approve, message } = req.body as { approve: boolean; message?: string };
    const result = await Svc.adminDecideCreate(id, admin.qq, approve, message);
    res.json(result);
  } catch (e) { next(e); }
}
