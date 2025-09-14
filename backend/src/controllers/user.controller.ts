import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { signToken } from "../middleware/auth";

const prisma = new PrismaClient();

export const userRegister = async (req: Request, res: Response) => {
    try {
        const { fullname, email, password, role } = req.body;

        if (!fullname || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const response = await prisma.user.create({
            data: { fullname, email, password: hashPassword, role }
        });

        res.status(201).json({ success: true, user: response });
    } catch (error) {
        console.log("Error User Registration: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


export const userLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const response = await prisma.user.findUnique({ where: { email } });

        // 4. Exclude sensitive fields
        const { password: _, ...safeUser } = user;

        const token = signToken({ id: user!.id, email: user!.email, role: user!.role });

        res.status(200).json({ success: true, user: safeUser, token, response });

    } catch (error) {
        console.log("Error User Login: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

