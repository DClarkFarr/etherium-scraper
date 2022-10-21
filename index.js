import express from "express";
import * as dotenv from "dotenv";
dotenv.config();

import bodyParser from "body-parser";
import cors from "cors";
import sessionFileStore from "session-file-store";
import session from "express-session";

// import webRoutes from "./routes/webRoutes.js";

const FileStore = sessionFileStore(session);

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.set("trust proxy", 1); // trust first proxy
app.use(
    session({
        store: new FileStore(),
        secret: "a happy lady danced around the crib",
        resave: true,
        saveUninitialized: true,
        cookie: { secure: false, path: "/", httpOnly: true },
    })
);

app.use("/assets", express.static("./web/dist/assets"));
app.use("*", express.static("./web/dist/"));

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
