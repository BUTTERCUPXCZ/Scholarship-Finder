import { z } from "zod";

export const applicationDocumentSchema = z.object({
    filename: z.string().min(1, "Filename is required"),
    contentType: z.string().min(1, "Content type is required"),
    size: z.number().int().nonnegative("Size must be a non-negative integer"),
    fileUrl: z.string().url("fileUrl must be a valid URL"),
    storagePath: z.string().min(1, "Storage path is required"),
});

export const submitApplicationSchema = z.object({
    scholarshipId: z.string().min(1, "Scholarship ID is required"),
    Firstname: z.string().min(1, "Firstname is required"),
    // Middlename is optional; allow empty string or undefined
    Middlename: z.string().optional(),
    Lastname: z.string().min(1, "Lastname is required"),
    Email: z.string().email("Invalid email address"),
    Phone: z.string().min(5, "Phone number is required"),
    Address: z.string().min(1, "Address is required"),
    City: z.string().min(1, "City is required"),
    personalStatement: z.string().optional(),
    documents: z.array(applicationDocumentSchema).optional(),
});

export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>;


