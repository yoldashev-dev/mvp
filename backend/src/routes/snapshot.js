import { Router } from "express";
import { getFinancialSnapshot } from "../logic/advisor.js";
import { ah } from "../lib/asyncHandler.js";

const router = Router();

router.get(
  "/",
  ah((req, res) => {
    const { telegram_id } = req.query;
    if (!telegram_id) return res.status(400).json({ error: "bad_request", message: "telegram_id required" });
    res.json(getFinancialSnapshot(telegram_id));
  })
);

export default router;
