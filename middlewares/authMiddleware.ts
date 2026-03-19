import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

interface JwtPayload {
    id: string;
}

export const protect = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let token;

        if (req.headers.authorization?.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET as string
            ) as JwtPayload;

            const user = await User.findById(decoded.id).select("-password");

            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            req.user = user;

            next();
        } else {
            return res.status(401).json({ message: "No token provided" });
        }
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return res.status(401).json({ message: "Invalid token" });
    }
};