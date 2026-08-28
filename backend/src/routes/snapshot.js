import { Router } from "express";
import { getFinancialSnapshot } from "../logic/advisor.js";

const router = Router();

router.get("/", (req, res) => {
  const { telegram_id } = req.query;
  if (!telegram_id) return res.status(400).json({ error: "telegram_id required" });
  res.json(getFinancialSnapshot(telegram_id));
});

export default router;
