"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitApplicationSchema = exports.applicationDocumentSchema = void 0;
const zod_1 = require("zod");
exports.applicationDocumentSchema = zod_1.z.object({
    filename: zod_1.z.string().min(1, "Filename is required"),
    contentType: zod_1.z.string().min(1, "Content type is required"),
    size: zod_1.z.number().int().nonnegative("Size must be a non-negative integer"),
    fileUrl: zod_1.z.string().url("fileUrl must be a valid URL"),
    storagePath: zod_1.z.string().min(1, "Storage path is required"),
});
exports.submitApplicationSchema = zod_1.z.object({
    scholarshipId: zod_1.z.string().min(1, "Scholarship ID is required"),
    Firstname: zod_1.z.string().min(1, "Firstname is required"),
    // Middlename is optional; allow empty string or undefined
    Middlename: zod_1.z.string().optional(),
    Lastname: zod_1.z.string().min(1, "Lastname is required"),
    Email: zod_1.z.string().email("Invalid email address"),
    Phone: zod_1.z.string().min(5, "Phone number is required"),
    Address: zod_1.z.string().min(1, "Address is required"),
    City: zod_1.z.string().min(1, "City is required"),
    personalStatement: zod_1.z.string().optional(),
    documents: zod_1.z.array(exports.applicationDocumentSchema).optional(),
});
