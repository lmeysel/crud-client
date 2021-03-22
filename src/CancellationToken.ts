

export declare type CancellationTokenContext = 'store' | 'select' | 'delete' | 'selectForDelete' | 'refresh';

export class CancellationToken {
	private _cancelled: boolean = false;
	public constructor(private _context: CancellationTokenContext) { }

	cancel(): void {
		this._cancelled = true;
	}
	isCancelled(): boolean {
		return this._cancelled;
	}
	context(): CancellationTokenContext {
		return this._context;
	}
}
