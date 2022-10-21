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

router.get("/address", (req, res) => {
    if (!req.session.address) {
        return res.status(404).json({ message: "No address saved" });
    }
    res.json({ address: req.session.address });
});

router.get("*", (req, res) => {
    res.status(404).json({ message: "Not found" });
});

export default router;
