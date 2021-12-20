/* eslint-disable @typescript-eslint/ban-types */

type HandlerFn = (...args: never[]) => void
type Handler = { once: boolean, callable: HandlerFn }

export class EventBus<T extends Record<string, HandlerFn>> {
	private events = new Map<keyof T, Handler[]>();

	private add<Q extends keyof T>(event: Q, callable: T[Q], once: boolean) {
		if (this.events.has(event))
			this.events.get(event).push({ callable, once });
		else
			this.events.set(event, [{ callable, once }]);
	}
	public once<Q extends keyof T>(event: Q, callable: T[Q]) {
		this.add(event, callable, true);
	}
	public on<Q extends keyof T>(event: Q, callable: T[Q]) {
		this.add(event, callable, false);
	}
	public off<Q extends keyof T>(event: Q, callable: T[Q]) {
		if (this.events.has(event)) {
			let events = this.events.get(event);
			events = events.filter(_ => _.callable !== callable);

			if (events.length)
				this.events.set(event, events);
			else
				this.events.delete(event);
		}
	}
	public emit<Q extends keyof T>(event: Q, ...args: Parameters<T[Q]>) {
		let handlers = this.events.get(event);
		if (handlers) {
			handlers = handlers.filter(({ once, callable }) => {
				callable(...args);
				return !once;
			});

			if (handlers.length)
				this.events.set(event, handlers);
			else
				this.events.delete(event);
		}
	}
}
