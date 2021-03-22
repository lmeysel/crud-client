/* eslint-disable @typescript-eslint/no-unused-vars */
declare type ItemId = string | number
declare type IdCallback<T, ItemId> = (item: T) => ItemId
declare type SortFunction<T> = (a: T, b: T) => number
declare type Item = Record<string | number | symbol, unknown>;
