import { Router } from "express";

const router = Router();

router.post("/address", (req, res) => {
    const address = req.body.address;
    if (!address) {
        return res.status(400).json({ error: "Missing address" });
    }

    req.session.address = address;

    return res.json({ saved: true });
});

export default router;
