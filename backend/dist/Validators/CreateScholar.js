"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScholarSchema = void 0;
const zod_1 = require("zod");
exports.createScholarSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    type: zod_1.z.string().min(1, "Type is required"),
    description: zod_1.z.string().min(1, "Description is required"),
    location: zod_1.z.string().min(1, "Location is required"),
    requirements: zod_1.z.string().min(1, "Requirements are required"),
    benefits: zod_1.z.string().min(1, "Benefits are required"),
    deadline: zod_1.z.string().refine((dateStr) => {
        const date = new Date(dateStr);
        return date > new Date();
    }, { message: "Deadline must be a future date" }),
});
