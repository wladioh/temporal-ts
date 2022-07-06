import { pathsToModuleNameMapper } from "ts-jest/utils";
// In the following statement, replace `./tsconfig` with the path to your `tsconfig` file
// which contains the path mapping (ie the `compilerOptions.paths` option):
import { compilerOptions } from "./tsconfig.json";
import { Config } from "@jest/types";

const config: Config.InitialOptions = {
	rootDir: ".",
	clearMocks: true,
	// test files settings
	testMatch: ["<rootDir>/tests/**/**.spec.ts", "<rootDir>/tests/**/**.test.ts"],
	testPathIgnorePatterns: ["dist", "node_modules"],
	moduleDirectories: ["<rootDir>/src", "node_modules"],
	testResultsProcessor: "jest-sonar-reporter",

	// test coverage
	coverageDirectory: "./coverage/",
	collectCoverageFrom: ["src/**/*.{ts,tsx}"],
	// coverageThreshold: {
	//   global: {
	//     branches: 80,
	//     functions: 80,
	//     lines: 80,
	//     statements: 80,
	//   },
	// },
	collectCoverage: true,
	coverageReporters: [
		"json",
		"lcov",
		"text",
		"clover",
		"cobertura",
		"lcov",
		"text-summary",
	],
	reporters: ["default", ["jest-junit", { outputDirectory: "./coverage" }]],

	moduleFileExtensions: ["js", "ts"],
	testEnvironment: "node",
	preset: "ts-jest",
	transform: {
		"^.+\\.(t|j)s$": "ts-jest",
	},
	moduleNameMapper: {
		...pathsToModuleNameMapper(compilerOptions.paths, {
			prefix: "<rootDir>/src",
		}),
	},
	roots: ["<rootDir>"],
	modulePaths: ["<rootDir>"],
	globals: {
		"ts-jest": {
			tsconfig: "./tsconfig.json",
		},
	},
};
export default config;
