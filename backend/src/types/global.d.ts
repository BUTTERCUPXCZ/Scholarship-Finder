// src/types/global.d.ts
declare namespace NodeJS {
    interface ProcessEnv {
        PORT?: string;
        JWT_SECRET: string;
        JWT_EXPIRES_IN?: string;
        DATABASE_URL?: string;
        NODE_ENV?: "development" | "production" | "test";
    }
}

export { }; // ensures this file is treated as a module
