import "express";

declare module "express-serve-static-core" {
    interface Request {
        // Added by authentication middleware
        userId?: string;
        user?: {
            id: string;
            email?: string;
            role?: string;
            fullname?: string;
            [key: string]: unknown;
        };
        // Added by multer when using upload.array(...)
        files?: Express.Multer.File[];
    }
}
