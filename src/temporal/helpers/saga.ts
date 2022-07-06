export type SagaOptions = {
	parallelCompensation: boolean;
	continueWithError: boolean;
};

export class Saga {
	private compensationOps: Array<(...args: any) => Promise<any>> = [];
	private options: SagaOptions;
	constructor(options?: SagaOptions) {
		this.options = Object.assign<any, SagaOptions | undefined, SagaOptions>(
			{},
			options,
			{
				continueWithError: false,
				parallelCompensation: false,
			}
		);
	}
	public addCompensation<W extends (...args: any) => Promise<any>>(
		action: W,
		...args: Parameters<W>
	) {
		const x = [...args];
		this.compensationOps.push(action.bind(null, ...x));
	}

	private async parallelCompensation() {
		const promises: Array<Promise<any>> = [];
		for (const iterator of this.compensationOps) {
			promises.push(iterator());
		}
		const results = await Promise.allSettled(promises);
		if (this.options.continueWithError) return;
		const erros = results
			.filter((p) => p.status === "rejected")
			.map((it: PromiseRejectedResult) => it.reason);
		if (erros.length) throw erros;
	}

	public async syncCompensation() {
		for (const iterator of this.compensationOps.reverse()) {
			try {
				await iterator();
			} catch (error) {
				if (!this.options.continueWithError) {
					throw error;
				}
			}
		}
	}

	public async compensate() {
		return this.options.parallelCompensation
			? this.parallelCompensation()
			: this.syncCompensation();
	}
}
