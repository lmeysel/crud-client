/* eslint-disable @typescript-eslint/no-explicit-any */

import { EventBus } from '../src/misc/EventBus';
type Events = {
	sthHappened(id: number): void
}

describe('EventBus', () => {
	it('should emit once', async () => {
		const bus = new EventBus<Events>();
		const handler = jest.fn();
		bus.once('sthHappened', handler);
		bus.emit('sthHappened', 10);
		bus.emit('sthHappened', 10);

		expect(handler).toBeCalledTimes(1);
		expect((bus as any).events.get('sthHappened')).toBeUndefined();
	})
	it('should emit twice', async () => {
		const bus = new EventBus<Events>();
		const handler = jest.fn();
		bus.on('sthHappened', handler);
		bus.emit('sthHappened', 10);
		bus.emit('sthHappened', 10);

		expect(handler).toBeCalledTimes(2);
		expect(handler).toBeCalledWith(10);
		expect((bus as any).events.get('sthHappened')).toBeDefined();
	})

	it('should remove handler', async () => {
		const bus = new EventBus<Events>();
		const handler = jest.fn();
		bus.on('sthHappened', handler);
		bus.off('sthHappened', handler);
		bus.emit('sthHappened', 10);

		expect(handler).toBeCalledTimes(0);
		expect((bus as any).events.get('sthHappened')).toBeUndefined();
	})

	it('should remove only one handler', async () => {
		const bus = new EventBus<Events>();
		const handler1 = jest.fn(), handler2 = jest.fn();
		bus.on('sthHappened', handler1);
		bus.on('sthHappened', handler2);
		bus.off('sthHappened', handler1);
		bus.emit('sthHappened', 10);

		expect(handler1).toBeCalledTimes(0);
		expect(handler2).toBeCalledTimes(1);
		expect((bus as any).events.get('sthHappened')).toBeDefined();
	})

})
