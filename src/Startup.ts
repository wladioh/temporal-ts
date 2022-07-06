import "reflect-metadata";
import "@utils/tracer/instrumentation";
import { Configuration, ConfigurationSchema } from "./Configuration";
import { YamlProvider, YamlWatcher } from "@app-config-yaml";
import { StartupBuilder } from "@app-inversify";
import { ConfigureServices } from "./ConfigureServices";
import { Application } from "./Application";

StartupBuilder.Given<Configuration>(ConfigurationSchema)
	.WithConfigureServices(ConfigureServices)
	.WithConfigProvider(YamlProvider.New("./configs/*.yaml"))
	.WithConfigWatcher(YamlWatcher.New("./configs/*.yaml"))
	.Run(Application);
