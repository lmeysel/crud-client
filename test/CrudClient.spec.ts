import { ArrayAccessor, CrudClient, ClientConfiguration } from '../src/index'
import { database, IPerson } from './test-helpers/TestData'
import { DirectTestConnector } from './test-helpers/DirectTestConnector'

describe('CRUD Client', () => {
	const connectorConfig = (overrides?: Partial<ClientConfiguration<IPerson, number>>) => {
		const ret = overrides || {}
		if (!('accessor' in ret)) ret.accessor = new ArrayAccessor([])
		if (!('connector' in ret)) ret.connector = new DirectTestConnector()
		if (!('connectorErrors' in ret)) ret.connectorErrors = 'silent'
		return ret as ClientConfiguration<IPerson, number>
	}

	it('should get items', async () => {
		const items = []
		const client = new CrudClient(connectorConfig({ accessor: new ArrayAccessor(items) }))
		await client.refresh()
		expect(items.length).toBe(database.count())
	})

	it('should reconfigure (forget old config)', () => {
		const client = new CrudClient(connectorConfig({ listCreatedItems: true }));
		expect((client as any).config.listCreatedItems).toStrictEqual(true); // eslint-disable-line @typescript-eslint/no-explicit-any

		client.configure(connectorConfig(), true);
		expect((client as any).config.listCreatedItems).toBeUndefined(); // eslint-disable-line @typescript-eslint/no-explicit-any
	})

	it('should reconfigure (merge old config)', () => {
		const client = new CrudClient(connectorConfig());
		expect((client as any).config.listCreatedItems).toBeUndefined(); // eslint-disable-line @typescript-eslint/no-explicit-any

		client.configure({ listCreatedItems: true });
		expect((client as any).config.listCreatedItems).toStrictEqual(true); // eslint-disable-line @typescript-eslint/no-explicit-any
	})

	it('should get corrected item index', async () => {
		const items = database.all()
		const client = new CrudClient(connectorConfig({ accessor: new ArrayAccessor(items) }))
		const index = 1 + Math.round(Math.random() * (items.length - 2)),
			item = items[index]

		expect((client as any).getItemIndex(item, index)).toBe(index) // eslint-disable-line @typescript-eslint/no-explicit-any
		items.splice(0, 1)
		expect((client as any).getItemIndex(item, index)).toBe(index - 1) // eslint-disable-line @typescript-eslint/no-explicit-any
	})

	it('should create item and store', async () => {
		const age = 100,
			name = 'asdf',
			items = database.all()
		const client = new CrudClient(
			connectorConfig({ accessor: new ArrayAccessor(items), createItem: () => ({ age, name }) })
		)
		const dbcount = database.count()
		client.create()
		expect(client.selectedItem).toEqual({ age, name })
		await client.store()
		expect(database.count()).toBe(dbcount + 1)

		const inserted = database.select(database.lastInsertId())
		expect(inserted).toMatchObject({ age, name })
	})

	it('should create item and store with listing item right after creation', async () => {
		const age = -1,
			name = 'asdf',
			items = database.all()
		const client = new CrudClient(
			connectorConfig({ accessor: new ArrayAccessor(items, (a, b) => a.age - b.age), createItem: () => ({ age, name }), listCreatedItems: true })
		)
		const dbcount = database.count()
		client.create()
		expect(items[0]).toEqual({ age, name });
		const newAge = items[1].age + .5;
		items[0].age = newAge;
		await client.store();

		expect(items[1]).toEqual({ age: newAge, name, id: database.lastInsertId() });
		expect(items.length).toBe(dbcount + 1);
	});


	it('should list created item and remove it after cancelling', async () => {
		const age = -1,
			name = 'asdf',
			items = database.all()
		const client = new CrudClient(
			connectorConfig({ accessor: new ArrayAccessor(items, (a, b) => a.age - b.age), createItem: () => ({ age, name }), listCreatedItems: true })
		)
		const dbcount = database.count()
		client.create()
		expect(items[0]).toEqual({ age, name });
		expect(items.length).toBe(dbcount + 1);

		client.cancel();
		expect(items.length).toBe(dbcount);
	});

	it('should edit a copy and store it on the server', async () => {
		const items: IPerson[] = database.all()
		const client = new CrudClient<IPerson, number>(
			connectorConfig({ accessor: new ArrayAccessor(items) })
		)

		// fail due to non-existent ID
		expect(await client.select(database.lastInsertId() + 100)).toBe(false)

		const item = database.randomExistingItem()
		const newName = 'Peter Shaw'
		expect(await client.select(item.id)).toBe(true)
		client.selectedItem.name = newName

		// a copy should be edited
		expect(item.name).not.toEqual(newName)

		const storePromise = client.store()
		const result = await storePromise
		expect(result).toBe(true) // client returns true
	})

	it('should throw if trying to store without having anything selected', async () => {
		const client = new CrudClient<IPerson, number>(connectorConfig())
		await expect(client.store()).rejects.toThrowError()
	})

	it('should delete item', async () => {
		const items: IPerson[] = database.all()
		const client = new CrudClient<IPerson, number>(
			connectorConfig({ accessor: new ArrayAccessor(items) })
		)
		const id = database.randomExistingId()

		// fail due to non-existent ID
		expect(await client.selectForDelete(database.lastInsertId() + 100)).toBe(false)

		expect(await client.selectForDelete(id)).toBe(true)
		await client.delete()
		expect(database.select(id)).toBe(undefined)
	})

	it('should throw if trying to delete without having anything selected', async () => {
		const client = new CrudClient<IPerson, number>(connectorConfig())
		await expect(client.delete()).rejects.toThrowError()
	})

	it('should throw if deletion/selection is cancelled and then committed', async () => {
		const items: IPerson[] = database.all()
		const client = new CrudClient<IPerson, number>(
			connectorConfig({ accessor: new ArrayAccessor(items) })
		)
		expect(await client.select(database.randomExistingId())).toBe(true)
		expect(await client.selectForDelete(database.randomExistingId())).toBe(true)
		client.cancel()
		await expect(client.delete()).rejects.toThrowError()
		await expect(client.store()).rejects.toThrowError()
	})
})
