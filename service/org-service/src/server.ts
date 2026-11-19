import "dotenv/config";
import express from "express";
import "reflect-metadata";
import "@/utils/container";
import orgRoutes from "@/routes/org.routes";
import errHandler from "./middlewares/err-handler";

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json({ limit: "32kb" }));

app.use("/organizations", orgRoutes);

app.use(errHandler);

app.listen(PORT, () => {
    console.log(`Org service running on port ${PORT}`);
});
