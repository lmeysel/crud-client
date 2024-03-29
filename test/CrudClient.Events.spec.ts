import { CancellationToken } from '../src/misc/CancellationToken'
import {
	ArrayAccessor,
	CrudClient,
	ClientConfiguration
} from '../src/index'
import { DirectTestConnector } from './test-helpers/DirectTestConnector'
import { database, IPerson } from './test-helpers/TestData'

describe('CRUD Client (events)', () => {
	const connectorConfig = async (overrides?: Partial<ClientConfiguration<IPerson, number>>) => {
		const ret = overrides || {}
		if (!('accessor' in ret)) ret.accessor = new ArrayAccessor(database.all());
		if (!('connector' in ret)) ret.connector = new DirectTestConnector()
		if (!('connectorErrors' in ret)) ret.connectorErrors = 'silent'
		return ret as ClientConfiguration<IPerson, number>
	}

	it('register event once', async () => {
		const client = new CrudClient<IPerson, number>(await connectorConfig());
		const beforeSelect = jest.fn();
		client.once('beforeSelect', beforeSelect);
		await client.select(1);
		await client.select(2);
		expect(beforeSelect).toBeCalledTimes(1);
	});
	it('register event permanent and remove', async () => {
		const client = new CrudClient<IPerson, number>(await connectorConfig());
		const beforeSelect1 = jest.fn(), beforeSelect2 = jest.fn();
		client.on('beforeSelect', beforeSelect1);
		client.on('beforeSelect', beforeSelect2);
		expect(await client.select(1)).toBe(true)
		client.off('beforeSelect', beforeSelect2);
		await client.select(2);
		expect(beforeSelect2).toBeCalledTimes(1);
		expect(beforeSelect1).toBeCalledTimes(2);
	});

	it('beforeStore', async () => {
		const testItem = database.randomExistingItem();
		const beforeStore = jest.fn((p: IPerson, c: CancellationToken) => {
			expect(p).toStrictEqual(testItem);
			expect(c.context()).toBe('store')
		});
		const client = new CrudClient<IPerson, number>(await connectorConfig());
		client.on('beforeStore', beforeStore);
		expect(await client.select(testItem.id)).toBe(true);
		expect(await client.store()).toBe(true);
		expect(beforeStore).toBeCalled();
	});
	it('beforeStore (cancelled)', async () => {
		const testItem = database.randomExistingItem();
		const beforeStore = jest.fn((p: IPerson, c: CancellationToken) => {
			expect(p).toStrictEqual(testItem);
			expect(c.context()).toBe('store')
			c.cancel();
		});
		const client = new CrudClient<IPerson, number>(await connectorConfig());
		client.on('beforeStore', beforeStore);
		expect(await client.select(testItem.id)).toBe(true);
		expect(await client.store()).toBe(false);
	}); it('afterStore', async () => {
		const testItem = database.randomExistingItem();
		const afterStore = jest.fn((p: IPerson) => { expect(p).toStrictEqual(testItem); });
		const client = new CrudClient<IPerson, number>(await connectorConfig());
		client.on('afterStore', afterStore);
		expect(await client.select(testItem.id)).toBe(true);
		expect(await client.store()).toBe(true);
		expect(afterStore).toBeCalled();
	});

	it('beforeRefresh', async () => {
		const beforeRefresh = jest.fn((c: CancellationToken) => {
			expect(c.context()).toBe('refresh')
		});
		const client = new CrudClient<IPerson, number>(await connectorConfig());
		client.on('beforeRefresh', beforeRefresh)
		expect(await client.refresh()).toBe(true);
		expect(beforeRefresh).toBeCalled();
	});
	it('beforeRefresh (cancelled asynchronously)', async () => {
		const beforeRefresh = jest.fn((c: CancellationToken) => {
			c.await(new Promise<void>(r => setTimeout(() => {
				c.cancel();
				r();
			}, 1)));
		});
		const client = new CrudClient<IPerson, number>(await connectorConfig());
		client.on('beforeRefresh', beforeRefresh);
		expect(await client.refresh()).toBe(false);
	});
	it('beforeRefresh (cancelled)', async () => {
		const beforeRefresh = jest.fn((c: CancellationToken) => {
			expect(c.context()).toBe('refresh');
			c.cancel();
		});
		const client = new CrudClient<IPerson, number>(await connectorConfig());
		client.on('beforeRefresh', beforeRefresh);
		expect(await client.refresh()).toBe(false);
		expect(beforeRefresh).toBeCalled();
	});
	it('afterRefresh', async () => {
		const afterRefresh = jest.fn((items: IPerson[]) => { expect(items).toStrictEqual(database.all()); });
		const client = new CrudClient<IPerson, number>(await connectorConfig());
		client.on('afterRefresh', afterRefresh);
		expect(await client.refresh()).toBe(true);
		expect(afterRefresh).toBeCalled();
	});

	it('beforeDelete', async () => {
		const testItem = database.randomExistingItem();
		const beforeDelete = jest.fn((p: IPerson, c: CancellationToken) => {
			expect(p).toStrictEqual(testItem)
			expect(c.context()).toBe('delete')
		});
		const client = new CrudClient<IPerson, number>(await connectorConfig());
		client.on('beforeDelete', beforeDelete);
		expect(await client.selectForDelete(testItem.id)).toBe(true);
		expect(await client.delete()).toBe(true);
		expect(beforeDelete).toBeCalled();
	});
	it('beforeDelete (cancelled)', async () => {
		const testItem = database.randomExistingItem();
		const beforeDelete = jest.fn((p: IPerson, c: CancellationToken) => {
			expect(p).toStrictEqual(testItem);
			expect(c.context()).toBe('delete');
			c.cancel();
		});
		const client = new CrudClient<IPerson, number>(await connectorConfig());
		client.on('beforeDelete', beforeDelete);
		expect(await client.selectForDelete(testItem.id)).toBe(true);
		expect(await client.delete()).toBe(false);
		expect(beforeDelete).toBeCalled();
	});
	it('afterDelete', async () => {
		const testItem = database.randomExistingItem();
		const afterDelete = jest.fn((p: IPerson) => { expect(p).toStrictEqual(testItem); });
		const client = new CrudClient<IPerson, number>(await connectorConfig());
		client.on('afterDelete', afterDelete);
		expect(await client.selectForDelete(testItem.id)).toBe(true);
		expect(await client.delete()).toBe(true);
		expect(afterDelete).toBeCalled();
	});

	it('beforeSelectForDelete', async () => {
		const testItem = database.randomExistingItem();
		const beforeSelectForDelete = jest.fn((p: IPerson, c: CancellationToken) => {
			expect(p).toStrictEqual(testItem)
			expect(c.context()).toBe('selectForDelete')
		});
		const client = new CrudClient<IPerson, number>(await connectorConfig());
		client.on('beforeSelectForDelete', beforeSelectForDelete);
		expect(await client.selectForDelete(testItem.id)).toBe(true);
		expect(beforeSelectForDelete).toBeCalled();
	});
	it('beforeSelectForDelete (cancelled)', async () => {
		const testItem = database.randomExistingItem();
		const beforeSelectForDelete = jest.fn((p: IPerson, c: CancellationToken) => {
			expect(p).toStrictEqual(testItem)
			expect(c.context()).toBe('selectForDelete')
			c.cancel();
		});
		const client = new CrudClient<IPerson, number>(await connectorConfig());
		client.on('beforeSelectForDelete', beforeSelectForDelete);
		expect(await client.selectForDelete(testItem.id)).toBe(false);
		expect(beforeSelectForDelete).toBeCalled();
	});
	it('afterSelectForDelete', async () => {
		const testItem = database.randomExistingItem();
		const afterSelectForDelete = jest.fn((p: IPerson) => { expect(p).toStrictEqual(testItem); });
		const client = new CrudClient<IPerson, number>(await connectorConfig());
		client.on('afterSelectForDelete', afterSelectForDelete)
		expect(await client.selectForDelete(testItem.id)).toBe(true);
		expect(afterSelectForDelete).toBeCalled();
	});

	it('beforeSelect', async () => {
		const testItem = database.randomExistingItem();
		const beforeSelect = jest.fn((p: IPerson, c: CancellationToken) => {
			expect(p).toStrictEqual(testItem)
			expect(c.context()).toBe('select')
		});
		const client = new CrudClient<IPerson, number>(await connectorConfig());
		client.on('beforeSelect', beforeSelect);
		expect(await client.select(testItem.id)).toBe(true);
		expect(beforeSelect).toBeCalled();
	});
	it('beforeSelect (cancelled)', async () => {
		const testItem = database.randomExistingItem();
		const beforeSelect = jest.fn((p: IPerson, c: CancellationToken) => {
			expect(p).toStrictEqual(testItem)
			expect(c.context()).toBe('select')
			c.cancel();
		});
		const client = new CrudClient<IPerson, number>(await connectorConfig());
		client.on('beforeSelect', beforeSelect);
		expect(await client.select(testItem.id)).toBe(false);
		expect(beforeSelect).toBeCalled();
	});
	it('afterSelect', async () => {
		const testItem = database.randomExistingItem();
		const afterSelect = jest.fn((p: IPerson) => { expect(p).toStrictEqual(testItem); });
		const client = new CrudClient<IPerson, number>(await connectorConfig());
		client.on('beforeSelect', afterSelect);
		expect(await client.select(testItem.id)).toBe(true);
		expect(afterSelect).toBeCalled();
	});
})
