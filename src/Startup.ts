import "reflect-metadata";
import "@utils/tracer/instrumentation";
import { Configuration, ConfigurationSchema } from "./Configuration";
import { YamlProvider, YamlWatcher } from "@app-config-yaml";
import { StartupBuilder } from "@app-inversify";
import { ConfigureServices } from "./ConfigureServices";
import { RunApplication } from "./Application";
import { PinoAdapterBuilder } from "@utils/PinoAdapterBuilder";

StartupBuilder.Given<Configuration>(ConfigurationSchema, PinoAdapterBuilder)
	.WithConfigureServices(ConfigureServices)
	.WithConfigProvider(YamlProvider.New("./configs/*.yaml"))
	.WithConfigWatcher(YamlWatcher.New("./configs/*.yaml"))
	// .WithConfigProvider(AppProvider)
	// .WithConfigWatcher(AppWatcher)
	.Run(RunApplication);
