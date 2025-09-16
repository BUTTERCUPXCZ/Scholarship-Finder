import { z } from 'zod'

// Zod schema for scholarship validation
export const scholarshipSchema = z.object({
    title: z.string()
        .min(5, 'Title must be at least 5 characters long')
        .max(100, 'Title must be less than 100 characters')
        .trim(),
    organizationType: z.string()
        .min(1, 'Organization type is required'),
    description: z.string()
        .min(20, 'Description must be at least 20 characters long')
        .max(2000, 'Description must be less than 2000 characters')
        .trim(),
    eligibilityRequirements: z.string()
        .min(10, 'Eligibility requirements must be at least 10 characters long')
        .max(1500, 'Eligibility requirements must be less than 1500 characters')
        .trim(),
    location: z.string()
        .min(2, 'Location must be at least 2 characters long')
        .max(100, 'Location must be less than 100 characters')
        .trim(),
    benefits: z.string()
        .min(10, 'Benefits description must be at least 10 characters long')
        .max(1000, 'Benefits description must be less than 1000 characters')
        .trim(),
    deadline: z.string()
        .min(1, 'Application deadline is required')
        .refine((date) => {
            const selectedDate = new Date(date)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            return selectedDate > today
        }, 'Deadline must be a future date')
})

// Export the inferred type for TypeScript
export type ScholarshipFormData = z.infer<typeof scholarshipSchema>

// Organization type options for the select dropdown
export const organizationTypes = [
    { value: 'university', label: 'University/College' },
    { value: 'nonprofit', label: 'Non-Profit Organization' },
    { value: 'foundation', label: 'Private Foundation' },
    { value: 'corporation', label: 'Corporation/Business' },
    { value: 'government', label: 'Government Agency' },
    { value: 'religious', label: 'Religious Organization' },
    { value: 'professional', label: 'Professional Association' },
    { value: 'community', label: 'Community Organization' },
    { value: 'individual', label: 'Individual/Family' },
    { value: 'other', label: 'Other' }
] as const

// Validation helper function
export const validateScholarshipForm = (data: ScholarshipFormData) => {
    try {
        scholarshipSchema.parse(data)
        return { success: true, errors: {} }
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors: Partial<Record<keyof ScholarshipFormData, string>> = {}
            error.issues.forEach((err) => {
                if (err.path.length > 0) {
                    const field = err.path[0] as keyof ScholarshipFormData
                    errors[field] = err.message
                }
            })
            return { success: false, errors }
        }
        return { success: false, errors: {} }
    }
}