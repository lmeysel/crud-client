declare type ItemId = string | number
declare type IdCallback<T, ItemId> = (item: T) => ItemId
declare type SortFunction<T> = (a: T, b: T) => number
