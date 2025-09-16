import { z } from "zod";

export const createScholarSchema = z.object({
    title: z.string().min(1, "Title is required"),
    type: z.string().min(1, "Type is required"),
    description: z.string().min(1, "Description is required"),
    location: z.string().min(1, "Location is required"),
    requirements: z.string().min(1, "Requirements are required"),
    benefits: z.string().min(1, "Benefits are required"),
    deadline: z.string().refine(
        (dateStr) => {
            const date = new Date(dateStr);
            return date > new Date();
        },
        { message: "Deadline must be a future date" }
    ),
});

export type CreateScholarInput = z.infer<typeof createScholarSchema>;
