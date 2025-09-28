import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "node",
    // include both the conventional __tests__ folder and the existing _tests_ folder
    testMatch: ["**/__tests__/**/*.test.ts", "**/_tests_/**/*.test.ts"], // find .test.ts files

};

export default config;
