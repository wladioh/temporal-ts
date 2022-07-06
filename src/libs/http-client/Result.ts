export class Result<T> {
	public isSuccess: boolean;
	public isFailure: boolean;
	public error?: any;
	private _value?: T;
	private constructor(isSuccess: boolean, error?: any, value?: T) {
		if (value && error) {
			throw new Error(`InvalidOperation: A result cannot be 
            successful and contain an error`);
		}
		if (value === undefined && error === undefined) {
			throw new Error(`InvalidOperation: A failing result 
            needs to contain an error message`);
		}

		this.isSuccess = isSuccess;
		this.isFailure = !this.isSuccess;
		this.error = error;
		this._value = value;

		Object.freeze(this);
	}

	public getError<TR>(): TR {
		return this.error;
	}

	public getValue(): T {
		if (this.isSuccess && this._value !== undefined) {
			return this._value;
		}
		throw new Error("Cant retrieve the value from a failed result.");
	}

	public static ok<U>(value?: U): Result<U> {
		return new Result<U>(true, undefined, value);
	}

	public static fail<U>(error: any): Result<U> {
		return new Result<U>(false, error);
	}

	public static combine(results: Result<unknown>[]): Result<any> {
		for (const result of results) {
			if (result.isFailure) return result;
		}
		return Result.ok<any>("Success");
	}
}
