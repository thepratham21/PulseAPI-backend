import mongoose, { Document, Schema } from "mongoose";

export interface IApiLog extends Document {
    api: mongoose.Types.ObjectId;
    status: string;
    responseTime: number;
    createdAt: Date;
    updatedAt: Date;
}

const apiLogSchema = new Schema(
    {
        api: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Api",
            required: true,
        },
        status: {
            type: String,
            enum: ["UP", "DOWN"],
        },
        responseTime: {
            type: Number,
        },
    },
    { timestamps: true }
);

export default mongoose.model<IApiLog>("ApiLog", apiLogSchema);