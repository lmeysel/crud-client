import { getAxiosConnector } from '../test-helpers/TestServer'
import { database, IPerson } from '../test-helpers/TestData'
import { IApiConnector } from '../../src'

describe('Axios Connector', () => {
  let connector: IApiConnector<IPerson>
  beforeAll(async () => {
    connector = await getAxiosConnector()
  })

  it('should read', async () => {
    const data = await connector.read()
    expect(data).toBeInstanceOf(Array)
    expect(data.length).toBe(database.count())
  })
  it('should create', async () => {
    const data: IPerson = { age: 22, name: 'Bob Andrews' }
    const result = await connector.create(data)
    expect(result.id).toBeDefined()
  })
  it('should update', async () => {
    const name = 'Peter Shaw',
      id = database.randomExistingId()
    const person: IPerson = Object.assign({}, database.select(id), { name })
    await connector.update(person.id, person)

    expect(database.select(id).name).toEqual(name)
  })
  it('should delete', async () => {
    const id = database.randomExistingId()
    await connector.delete(id)
    expect(database.select(id)).toBeUndefined()
  })
})
