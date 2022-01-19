export interface RouteProvider<T> {
	create(item: T): string;
	read(): string;
	update(id: string | number, item: T): string;
	delete(id: string | number): string;
}
