import express from "express";
import "reflect-metadata";
import "./utils/container";
import sessionRoutes from "@/routes/session.routes";
import errHandler from "@/middlewares/err-handler";

const app = express();
const PORT = process.env.PORT ?? 3002;

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use("/sessions", sessionRoutes);

app.use(errHandler);

app.listen(PORT, () => {
    console.log(`Session service is running on port ${PORT}`);
});