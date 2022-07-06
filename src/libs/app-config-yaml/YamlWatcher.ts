import { IWatcherStrategy, KeyValue } from "@app-config";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import glob from "glob";

type CallBack = (values: KeyValue) => void;
export class YamlWatcher implements IWatcherStrategy {
	private paths: string[];
	private yamlExt = [".yaml", ".yml"];
	constructor(...paths: string[]) {
		this.paths = paths;
	}
	private files(): string[] {
		return this.paths
			.map((it) => glob.sync(it))
			.reduce((ac, it) => ac.concat(it), [])
			.map((it) => path.resolve(it))
			.filter((it) => this.yamlExt.indexOf(path.extname(it)) >= 0);
	}
	private async onChaged(file: string, valuesCallback: CallBack) {
		const data = fs.readFileSync(file, "utf8");
		const doc = yaml.load(data);
		valuesCallback(<any>doc);
	}
	Watch(valuesCallback: CallBack): Promise<void> {
		const files = this.files();
		for (const file of files) {
			fs.watch(file, () => this.onChaged(file, valuesCallback));
		}
		return Promise.resolve();
	}
	static New(...paths: string[]): YamlWatcher {
		return new YamlWatcher(...paths);
	}
}
