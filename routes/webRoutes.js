import express, { Router } from "express";

const router = Router();

router.use(express.static("../web/dist"));

export default router;
