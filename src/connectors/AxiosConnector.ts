import axios, { AxiosInstance } from 'axios'
import { ApiConnector } from '../interfaces/ApiConnector'
import { RouteProvider } from '../interfaces/RouteProvider'
import { DefaultRouteProvider } from '../misc/DefaultRouteProvider';
export class AxiosConnector<T> implements ApiConnector<T> {
	private route: RouteProvider<T>

	/**
	 * @param route The base route to access for REST requests.
	 * @param adapter The axios instance to use for REST requests.
	 */
	constructor(route: string | RouteProvider<T>, private adapter: AxiosInstance = axios) {
		if (typeof route === 'string')
			this.route = new DefaultRouteProvider(route);
		else
			this.route = route;
	}

	async read(): Promise<T[]> {
		const { data } = await this.adapter.get<T[]>(this.route.read())
		return data
	}
	async create(item: T): Promise<T> {
		const { data } = await this.adapter.post<T>(this.route.create(item), item)
		return data
	}
	async update(id: string | number, item: T): Promise<T> {
		const { data } = await this.adapter.put<T>(this.route.update(id, item), item)
		return data
	}
	async delete(id: string | number): Promise<void> {
		await this.adapter.delete(this.route.delete(id))
	}
}
