import { db } from "@/config/db";

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type DatabaseExecutor = typeof db | Transaction;
