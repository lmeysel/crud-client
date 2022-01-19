

export declare type CancellationTokenContext = 'store' | 'select' | 'delete' | 'selectForDelete' | 'refresh';

export class CancellationToken {
	private _cancelled: boolean = false;
	private _pending: number = 0;
	private _done: (res: boolean) => void;

	public constructor(private _context: CancellationTokenContext) {
	}

	cancel(): void {
		this._cancelled = true;
	}
	get cancelled(): Promise<boolean> {
		if (this._pending) {
			const awaiter = new Promise<boolean>(r => this._done = r);
			return awaiter;
		}
		return Promise.resolve(this._cancelled);
	}
	await(promise: Promise<void>) {
		this._pending++;
		promise.finally(() => {
			this._pending--
			if (this._done && !this._pending)
				this._done(this._cancelled)
		})
	}
	context(): CancellationTokenContext {
		return this._context;
	}
}
