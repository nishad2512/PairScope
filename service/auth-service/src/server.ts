import express from "express";
import "reflect-metadata";
import "./utils/container";
import cookieParser from "cookie-parser";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "node:path";
import { container } from "tsyringe";
import { GrpcController } from "./controllers/grpc.controller";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";

const app = express();
const PORT = process.env.PORT || 3001;
const GRPC_PORT = process.env.GRPC_PORT || 50051;

const packageDefinition = protoLoader.loadSync(
    path.join(process.cwd(), "proto/auth.proto"),
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    },
);
const authPackage = grpc.loadPackageDefinition(packageDefinition);
const auth = authPackage["auth"] as grpc.GrpcObject;
const authService = auth["AuthService"] as grpc.ServiceClientConstructor;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/user", userRoutes);

function startServer() {
    app.listen(PORT, () => {
        console.log(`Auth [rest] is running on port ${PORT}`);
    });


    const grpcServer = new grpc.Server();
    const grpcController = container.resolve(GrpcController);

    grpcServer.addService(authService.service, {
        GetUserData: grpcController.getUserData.bind(grpcController),
    });

    grpcServer.bindAsync(
        `0.0.0.0:${GRPC_PORT}`,
        grpc.ServerCredentials.createInsecure(),
        (error, port) => {
            if (error) throw error;
            console.log(`Auth [grpc] is running on port ${port}`);
        },
    );
}

startServer();
