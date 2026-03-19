import mongoose, { Document, Schema } from "mongoose";

export interface IApi extends Document {
    name: string;
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    user: mongoose.Types.ObjectId;
    status: string;
    responseTime: number;
}

const apiSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
        method: {
            type: String,
            enum: ["GET", "POST", "PUT", "DELETE"],
            default: "GET",
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            default: "unknown",
        },
        responseTime: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

export default mongoose.model<IApi>("Api", apiSchema);