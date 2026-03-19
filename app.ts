import express, { Application, Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";

const app: Application = express();


app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

// Health Check Route
app.get("/", (req: Request, res: Response) => {
    res.send("PulseAPI is running !");
});

export default app;
