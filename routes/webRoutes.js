import { Router } from "express";

const router = Router();

router.get("*", (req, res) => {
    if (!req.session.homeViews) {
        req.session.homeViews = 0;
    }
    req.session.homeViews++;
    console.log("got home views", req.session.homeViews);
    res.send("<h1>You got it (" + req.session.homeViews + ")</h1>");
});

export default router;
