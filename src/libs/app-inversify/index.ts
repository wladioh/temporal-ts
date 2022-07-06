import { Container } from "inversify";
export * from "./StartupBuilder";
export * from "./Decorators";
export * from "./TYPES";
export * from "./Container";
export * from "./Application";
export type ServiceConfigureFunc = (container: Container) => Promise<void>;
