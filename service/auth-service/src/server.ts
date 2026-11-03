import express from 'express';
import 'reflect-metadata';
import './utils/container';
import { db } from './config/db';
import { users } from './models/user.model';

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/', async (req, res) => {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
});

app.listen(PORT, () => {
    console.log(`Auth [rest] is running on port ${PORT}`);
});