import { RouteProvider } from '../interfaces/RouteProvider';

export class DefaultRouteProvider<T> implements RouteProvider<T> {
	constructor(private route: string) {
	}
	create() {
		return this.route;
	}
	read() {
		return this.route;
	}
	update(id: string | number) {
		return this.route + '/' + id;
	}
	delete(id: string | number) {
		return this.route + '/' + id;
	}
}
