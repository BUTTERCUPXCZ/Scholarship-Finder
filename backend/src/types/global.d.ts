// src/types/global.d.ts
declare namespace NodeJS {
    interface ProcessEnv {
        PORT?: string;
        JWT_SECRET: string;
        JWT_EXPIRES_IN?: string;
        DATABASE_URL?: string;
        DIRECT_URL?: string;
        NODE_ENV?: "development" | "production" | "test";
        SUPABASE_URL?: string;
        SUPABASE_SERVICE_ROLE_KEY?: string;
    }
}

export { }; // ensures this file is treated as a module


