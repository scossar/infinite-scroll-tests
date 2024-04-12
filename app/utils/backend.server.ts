/*const items = (global.__items =
  global.__items ??
  Array.from({ length: 50_000 }, (_, i) => ({
    id: i.toString(),
    value: `Item ${i}`,
  })));

export async function getItems({
  start,
  limit,
}: {
  start: number;
  limit: number;
}) {
  return items.slice(start, start + limit);
}

export async function getItemsPaginated({
  page,
  limit,
}: {
  page: number;
  limit: number;
}) {
  const start = page * limit;
  return items.slice(start, start + limit);
}

export async function countItems() {
  return items.length;
}*/

type Item = {
  id: string;
  value: string;
};
type Items = Item[];
type FetcherData = {
  items: Items;
  nextPage: number;
};

const items = (global.__items =
  global.__items ??
  Array.from({ length: 50_000 }, (_, i) => ({
    id: i.toString(),
    value: `Item ${i}`,
  })));

export async function getItems({
  start,
  limit,
}: {
  start: number;
  limit: number;
}) {
  // Introducing a delay of 500 milliseconds to simulate network latency
  return new Promise<Items>((resolve) => {
    setTimeout(() => {
      resolve(items.slice(start, start + limit));
    }, 500); // You can adjust the delay here to be longer or shorter as needed
  });
}

export async function getItemsPaginated({
  page,
  limit,
}: {
  page: number;
  limit: number;
}) {
  const start = page * limit;
  // Using the same delay mechanism as in getItems
  return new Promise<Items>((resolve) => {
    setTimeout(() => {
      resolve(items.slice(start, start + limit));
    }, 500); // Adjust delay as necessary
  });
}

export async function countItems() {
  // Introducing delay in counting items, if needed
  return new Promise<number>((resolve) => {
    setTimeout(() => {
      resolve(items.length);
    }, 500); // Adjust delay as necessary
  });
}
