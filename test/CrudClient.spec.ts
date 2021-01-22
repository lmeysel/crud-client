import { ArrayAccessor, CrudClient, IClientConfiguration } from '../src/index'
import { database, IPerson } from './test-helpers/TestData'
import { DirectTestConnector } from './test-helpers/DirectTestConnector'

describe('CRUD Client', () => {
  let connectorConfig: IClientConfiguration<IPerson, number>
  beforeAll(async () => {
    connectorConfig = { connector: new DirectTestConnector(), connectorErrors: 'throw' }
  })

  it('should get items', async () => {
    const items = []
    const client = new CrudClient(new ArrayAccessor(items), connectorConfig)
    await client.refresh()
    expect(items.length).toBe(database.count())
  })

  it('should get corrected item index', async () => {
    const items = database.all()
    const client = new CrudClient(new ArrayAccessor(items), connectorConfig)
    const index = 1 + Math.round(Math.random() * (items.length - 2)),
      item = items[index]

    expect((client as any).getItemIndex(item, index)).toBe(index)
    items.splice(0, 1)
    expect((client as any).getItemIndex(item, index)).toBe(index - 1)
  })

  it('should create item and store', async () => {
    const age = 100,
      name = 'asdf',
      items = database.all()
    const client = new CrudClient(
      new ArrayAccessor(items),
      Object.assign({ createItem: () => ({ age, name }) }, connectorConfig)
    )
    const dbcount = database.count()
    client.create()
    expect(client.selectedItem).toEqual({ age, name })
    await client.store()
    expect(database.count()).toBe(dbcount + 1)

    const inserted = database.select(database.lastInsertId())
    expect(inserted).toMatchObject({ age, name })
  })

  it('should edit a copy and store it on the server', async () => {
    const items: IPerson[] = database.all()
    const client = new CrudClient<IPerson, number>(new ArrayAccessor(items), connectorConfig)

    // fail due to non-existent ID
    expect(client.select(database.lastInsertId() + 100)).toBe(false)

    const item = database.randomExistingItem()
    const newName = 'Peter Shaw'
    expect(client.select(item.id)).toBe(true)
    client.selectedItem.name = newName

    // a copy should be edited
    expect(item.name).not.toEqual(newName)

    const storePromise = client.store()

    // optimitic response (before server answers)
    expect(item.name).toEqual(newName)

    const result = await storePromise
    expect(result).toBe(true) // client returns true
  })

  it('should throw if trying to store without having anything selected', async () => {
    const client = new CrudClient<IPerson, number>(new ArrayAccessor([]), connectorConfig)
    await expect(client.store()).rejects.toThrowError()
  })

  it('should delete item', async () => {
    const items: IPerson[] = database.all()
    const client = new CrudClient<IPerson, number>(new ArrayAccessor(items), connectorConfig)
    const id = database.randomExistingId()

    // fail due to non-existent ID
    expect(client.selectForDelete(database.lastInsertId() + 100)).toBe(false)

    expect(client.selectForDelete(id)).toBe(true)
    await client.delete()
    expect(database.select(id)).toBe(undefined)
  })

  it('should throw if trying to delete without having anything selected', async () => {
    const client = new CrudClient<IPerson, number>(new ArrayAccessor([]), connectorConfig)
    await expect(client.delete()).rejects.toThrowError()
  })

  it('should throw if deletion/selection is cancelled and then committed', async () => {
    const items: IPerson[] = database.all()
    const client = new CrudClient<IPerson, number>(new ArrayAccessor(items), connectorConfig)
    expect(client.select(database.randomExistingId())).toBe(true)
    expect(client.selectForDelete(database.randomExistingId())).toBe(true)
    client.cancel()
    await expect(client.delete()).rejects.toThrowError()
    await expect(client.store()).rejects.toThrowError()
  })
})
