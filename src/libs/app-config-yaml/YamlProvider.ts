import { IConfigurationProvider, KeyValue } from "@app-config";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import lodash from "lodash";
import glob from "glob";

export class YamlProvider implements IConfigurationProvider {
	private paths: string[];
	private yamlExt = [".yaml", ".yml"];
	constructor(...paths: string[]) {
		this.paths = paths;
	}
	async Load(configs: KeyValue): Promise<KeyValue> {
		let config = {};
		try {
			const files = this.paths
				.map((it) => glob.sync(it))
				.reduce((ac, it) => ac.concat(it), [])
				.map((it) => path.resolve(it))
				.filter((it) => this.yamlExt.indexOf(path.extname(it)) >= 0);
			for (const file of files) {
				const data = fs.readFileSync(file, "utf8");
				const doc = yaml.load(data);
				config = lodash.merge(config, doc);
			}
		} catch (e) {
			console.log(e);
		}
		return Promise.resolve(config);
	}
	static New(...paths: string[]): YamlProvider {
		return new YamlProvider(...paths);
	}
}
