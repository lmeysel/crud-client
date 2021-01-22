import express, { Request, Response } from 'express'
import { pick } from 'lodash'
import { Server } from 'http'
import { database, IPerson } from './TestData'
import axios from 'axios'
import { AxiosConnector } from '../../src'

const app = express()
app.use(express.json())
let server: Server

const serverBoot = new Promise<void>((resolve, reject) => {
  try {
    server = app.listen(0, () => {
      resolve()
    })
  } catch (x) {
    reject(x)
  }
})

interface ConfigOverrides {
  failIndex: boolean
  failShow: boolean
  failCreate: boolean
  failStore: boolean
  failDelete: boolean
  noResultOnCreation: boolean
}
let overrides: Partial<ConfigOverrides>
beforeEach(() => (overrides = {}))
beforeAll(done => serverBoot.then(done))
afterAll(() => server.close())

app.get('/people', (req: Request, res: Response) => {
  if (overrides.failIndex) res.status(500).send('Internal server error.')
  return res.json(database.all())
})
app.get('/people/:id', (req: Request, res: Response) => {
  if (overrides.failShow) res.status(500).send('Internal server error.')
  return res.json(database.select(req.params.id))
})
app.post('/people', (req: Request, res: Response) => {
  if (overrides.failCreate) res.status(500).send('Internal server error.')
  const data = pick(req.body, 'name', 'age') as IPerson
  const result = database.insert(data)
  if (overrides.noResultOnCreation) return res.sendStatus(201)
  else return res.status(201).json(result)
})
app.put('/people/:id', (req: Request, res: Response) => {
  if (overrides.failStore) res.status(500).send('Internal server error.')
  const data = pick(req.body, 'id', 'name', 'age') as IPerson
  database.update(data.id, data)
  return res.sendStatus(200)
})
app.delete('/people/:id', (req: Request, res: Response) => {
  if (overrides.failDelete) res.status(500).send('Internal server error.')
  database.delete(req.params.id)
  return res.sendStatus(200)
})

export async function getAddress() {
  await serverBoot
  return 'http://localhost:' + (server.address() as any).port
}
export async function getRoute() {
  await serverBoot
  return '/people'
}
export async function getAxiosConnector() {
  const [route, address] = await Promise.all([getRoute(), getAddress()])
  return new AxiosConnector(route, axios.create({ baseURL: address }))
}
export function temporaryOverride<T extends keyof ConfigOverrides>(
  key: T,
  value: ConfigOverrides[T]
) {
  overrides[key] = value
}
