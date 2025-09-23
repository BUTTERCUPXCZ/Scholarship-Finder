export { };

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            PORT?: string;
            JWT_SECRET: string;
            JWT_EXPIRES_IN?: string;
            DATABASE_URL?: string;
            DIRECT_URL?: string;
            NODE_ENV?: "development" | "production" | "test";
            FRONTEND_URL?: string;
            SUPABASE_URL: string;
            SUPABASE_SERVICE_ROLE_KEY: string;
            RATE_LIMIT_WINDOW_MS?: string;
            RATE_LIMIT_MAX_REQUESTS?: string;
            CORS_ORIGINS?: string;
        }
    }
}



