

export declare type CancellationTokenContext = 'store' | 'select' | 'delete' | 'selectForDelete' | 'refresh';

export class CancellationToken {
  private _cancelled: boolean = false;
  public constructor(private _context: CancellationTokenContext) { }

  cancel() {
    this._cancelled = true;
  }
  isCancelled() {
    return this._cancelled;
  }
  context(): CancellationTokenContext {
    return this._context;
  }
}
