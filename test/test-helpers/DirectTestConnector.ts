import { IApiConnector } from '../../src/index'
import { database, IPerson } from './TestData'

export class DirectTestConnector implements IApiConnector<IPerson> {
  read(): Promise<IPerson[]> {
    return Promise.resolve(database.all())
  }
  create(item: IPerson): Promise<IPerson> {
    return Promise.resolve(database.insert(item))
  }
  update(id: string | number, item: IPerson): Promise<IPerson> {
    database.update(id, item)
    return Promise.resolve(database.select(id))
  }
  delete(id: string | number): Promise<void> {
    database.delete(id)
    return Promise.resolve()
  }
}
