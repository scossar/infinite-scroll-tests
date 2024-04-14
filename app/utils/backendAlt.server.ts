export type Item = {
  id: string;
  value: string;
};
export type Items = Item[];

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
  return new Promise<Items>((resolve) => {
    setTimeout(() => {
      resolve(items.slice(start, start + limit));
    }, 500);
  });
}

export async function getItemsFrom({
  after,
  limit,
}: {
  after: string;
  limit: number;
}) {
  return new Promise<Items>((resolve) => {
    setTimeout(() => {
      let index = items.findIndex((i) => i.id === after);
      resolve(items.slice(index, index + limit));
    }, 500);
  });
}

export async function getIndexFor({ id }: { id: string }) {
  return new Promise<number>((resolve) => {
    setTimeout(() => {
      resolve(items.findIndex((i) => (i.id = id)));
    }, 500);
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
  return new Promise<Items>((resolve) => {
    setTimeout(() => {
      resolve(items.slice(start, start + limit));
    }, 500);
  });
}

export async function countItems() {
  return new Promise<number>((resolve) => {
    setTimeout(() => {
      resolve(items.length);
    }, 500);
  });
}
