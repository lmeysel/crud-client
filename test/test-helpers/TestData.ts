/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { pick } from 'lodash'
import faker from 'faker'

export interface IPerson {
	id?: number
	name?: string
	age?: number
}

let lastInsertId = 1
function nextId() {
	lastInsertId += 1 + Math.round(Math.random() * 5)
	return lastInsertId
}
const data: IPerson[] = []
function randomElement(key?: keyof IPerson) {
	if (data && data.length) {
		const ret = data[Math.round((data.length - 1) * Math.random())]
		return arguments.length ? ret[key] : ret
	}
	return null
}

export const database = {
	select: (id: string | number) => data.find(d => d.id == id), // tslint:disable-line: triple-equals
	all: () => data.map(entry => Object.assign({}, entry)),
	update: (id: string | number, entity: IPerson) => {
		const index = data.findIndex(d => d.id == id) // tslint:disable-line: triple-equals
		if (index !== -1) {
			Object.assign(data[index], pick(entity, 'name', 'age'))
		}
	},
	insert: (entity: IPerson) => {
		entity.id = nextId()
		data.push(entity)
		return entity
	},
	delete: (id: string | number) => {
		const index = data.findIndex(d => d.id == id) // tslint:disable-line: triple-equals
		if (index !== -1) {
			data.splice(index, 1)
		}
	},
	lastInsertId: () => lastInsertId,
	generate: (size: number = 30) => {
		data.length = size
		lastInsertId = 1
		for (let i = 0; i < size; i++) data[i] = { id: nextId(), ...database.randomNonExistingPerson() }
	},
	randomNonExistingPerson: (): IPerson => ({
		name: faker.name.findName(),
		age: 15 + Math.round(Math.random() * 60)
	}),
	randomExistingId: () => randomElement('id') as number,
	randomExistingItem: () => randomElement() as IPerson,
	count: () => data.length
}

database.generate()
afterEach(() => database.generate())
