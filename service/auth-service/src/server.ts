import express from "express";
import "reflect-metadata";
import "./utils/container";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/user", userRoutes);

app.listen(PORT, () => {
    console.log(`Auth [rest] is running on port ${PORT}`);
});
