import axios, { AxiosInstance } from 'axios'
import { ApiConnector } from '../interfaces/ApiConnector'

export class AxiosConnector<T> implements ApiConnector<T> {
	/**
	 * @param route The base route to access for REST requests.
	 * @param adapter The axios instance to use for REST requests.
	 */
	constructor(private route: string, private adapter: AxiosInstance = axios) { }

	async read(): Promise<T[]> {
		const { data } = await this.adapter.get<T[]>(this.route)
		return data
	}
	async create(item: T): Promise<T> {
		const { data } = await this.adapter.post<T>(this.route, item)
		return data
	}
	async update(id: string | number, item: T): Promise<T> {
		const { data } = await this.adapter.put<T>(this.route + '/' + id, item)
		return data
	}
	async delete(id: string | number): Promise<void> {
		await this.adapter.delete(this.route + '/' + id)
	}
}
