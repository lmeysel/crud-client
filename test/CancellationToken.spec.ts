/* eslint-disable @typescript-eslint/no-explicit-any */

import { CancellationToken } from '../src/CancellationToken';

describe('CancellationToken', () => {
	it('does not cancel synchronous', async () => {
		const ctoken = new CancellationToken('refresh');
		expect(await ctoken.cancelled).toEqual(false);
	});

	it('cancels synchronous', async () => {
		const ctoken = new CancellationToken('refresh');
		ctoken.cancel();
		expect(await ctoken.cancelled).toEqual(true);
	})

	it('does not cancel asynchronous', async () => {
		const ctoken = new CancellationToken('refresh');
		ctoken.await(new Promise<void>(r => setTimeout(r, 1)));
		expect(await ctoken.cancelled).toEqual(false);
	})

	it('cancels asynchronous', async () => {
		const ctoken = new CancellationToken('refresh');
		ctoken.await(new Promise<void>(r => setTimeout(() => {
			ctoken.cancel();
			r();
		}, 1)));
		expect(await ctoken.cancelled).toEqual(true);
	})
})
