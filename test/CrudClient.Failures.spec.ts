import {
  ArrayAccessor,
  AxiosConnector,
  CrudClient,
  IApiConnector,
  IClientConfiguration,
} from '../src/index'
import { database, IPerson } from './test-helpers/TestData'
import { getAxiosConnector, temporaryOverride } from './test-helpers/TestServer'

describe('CRUD Client (Failures)', () => {
  const connectorConfig = async (overrides?: Partial<IClientConfiguration<IPerson, number>>) => {
    const ret = overrides || {}
    if (!('accessor' in ret)) ret.accessor = new ArrayAccessor([])
    if (!('connector' in ret)) ret.connector = await getAxiosConnector()
    if (!('connectorErrors' in ret)) ret.connectorErrors = 'silent'
    return ret as IClientConfiguration<IPerson, number>
  }

  it('should throw if trying to store without having anything selected', async () => {
    const client = new CrudClient<IPerson, number>(await connectorConfig())
    await expect(client.store()).rejects.toThrowError()
  })
  it('should throw if trying to delete without having anything selected', async () => {
    const client = new CrudClient<IPerson, number>(await connectorConfig())
    await expect(client.delete()).rejects.toThrowError()
  })

  it('should fail due to server-error on index', async () => {
    const client = new CrudClient<IPerson, number>(await connectorConfig())
    temporaryOverride('failIndex', true)
    expect(await client.refresh()).toBe(false)
  })
  it('should roll-back on client due to server-error while storing.', async () => {
    const client = new CrudClient<IPerson, number>(
      await connectorConfig({ accessor: new ArrayAccessor(database.all()) })
    )
    const id = database.randomExistingId(),
      newName = 'Peter Shaw'

    temporaryOverride('failStore', true)

    // select item and trigger storing
    expect(client.select(id)).toBe(true)
    const oldName = client.selectedItem.name
    client.selectedItem.name = newName
    const storing = client.store()

    // optimistic response
    expect(client.selectionContext.originalItem.name).toBe(newName)

    // server fails
    expect(await storing).toBe(false)

    // expect rollback
    expect(client.selectionContext.originalItem.name).toBe(oldName)
  })
  it('should roll-back on client due to server-error while creation of a new item.', async () => {
    const items = database.all()
    const client = new CrudClient<IPerson, number>(
      await connectorConfig({ accessor: new ArrayAccessor(items) })
    )
    temporaryOverride('failCreate', true)
    client.create()
    const item = Object.assign(client.selectedItem, { name: 'Peter Shaw', age: 12 })
    const storing = client.store()
    expect(items).toContain(item) // optimistic response
    expect(await storing).toBe(false) // server fails
    expect(items).not.toContain(item) // expect rollback
  })
  it('should fail due to server-error on deletion', async () => {
    const client = new CrudClient<IPerson, number>(
      await connectorConfig({ accessor: new ArrayAccessor(database.all()) })
    )
    const id = database.randomExistingId()
    temporaryOverride('failDelete', true)
    expect(client.selectForDelete(id)).toBe(true)
    expect(await client.delete()).toBe(false)
  })

  it('should throw if requested item index does not exist anymore.', async () => {
    const items = database.all(),
      id = database.randomExistingId(),
      index = items.findIndex((itm) => itm.id === id),
      item = items[index]

    const client = new CrudClient<IPerson, number>(
      await connectorConfig({ accessor: new ArrayAccessor(items) })
    )

    // remove item
    items.splice(index, 1)

    expect(() => (client as any).getItemIndex(item, index)).toThrowError()
  })

  it('should forward exception to console.error', () => {
    const client = new CrudClient<IPerson, number>({
      accessor: null,
      connector: null,
      connectorErrors: 'print',
    })
    const fn = jest.fn()
    console.error = fn
    const msg = 'Some test error'
    ;(client as any).forwardError(msg)
    expect(console.error).toBeCalled()
  })
  it('should forward exception throw', () => {
    const client = new CrudClient<IPerson, number>({
      accessor: null,
      connector: null,
      connectorErrors: 'throw',
    })
    const msg = 'Some test error'
    expect(() => (client as any).forwardError(msg)).toThrow()
  })
})
