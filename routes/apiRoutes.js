import { Router } from "express";
import { Alchemy, Network } from "alchemy-sdk";
import { orderBy } from "lodash-es";

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
router.get("/transactions", async (req, res) => {
    const address = req.query.address;

    const config = {
        apiKey: process.env.ACHEMY_API_KEY,
        network: Network.ETH_MAINNET,
    };
    const alchemy = new Alchemy(config);

    let rows = [];

    if (req.session.transactions) {
        return res.json({
            transactions: req.session.transactions,
            cache: true,
        });
    }

    try {
        const fromRows = await alchemy.core
            .getAssetTransfers({
                fromBlock: "0x0",
                fromAddress: address,
                // toAddress: address,
                category: ["external", "internal", "erc20"],
                withMetadata: true,
            })
            .then(({ transfers }) => transfers);

        fromRows.forEach((r) => {
            rows.push({
                hash: r.hash,
                from: r.from,
                to: r.to,
                asset: r.asset,
                value: r.value,
                timestamp: r.metadata.blockTimestamp,
            });
        });

        const toRows = await alchemy.core
            .getAssetTransfers({
                fromBlock: "0x0",
                toAddress: address,
                category: ["external", "internal", "erc20"],
                withMetadata: true,
            })
            .then(({ transfers }) => transfers);

        toRows.forEach((r) => {
            rows.push({
                hash: r.hash,
                from: r.from,
                to: r.to,
                asset: r.asset,
                value: r.value,
                timestamp: r.metadata.blockTimestamp,
            });
        });

        rows = orderBy(rows, ["timestamp"], ["desc"]);
    } catch (err) {
        console.log("error fetching transactions", err);
        return res.status(500).json({ error: err.message });
    }

    req.session.transactions = rows;

    res.json({ transactions: rows, cache: false });
});

router.get("*", (req, res) => {
    res.status(404).json({ message: "Not found" });
});

export default router;
