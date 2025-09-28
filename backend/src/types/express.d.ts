import "express";

declare module "express-serve-static-core" {
    interface Request {
        // Added by authentication middleware
        userId?: string;
        // Added by multer when using upload.array(...)
        files?: Express.Multer.File[];
    }
}
