export type Item = {
  id: string;
  value: string;
};
export type Items = Item[];

const localItems = Array.from({ length: 500 }, (_, i) => ({
  id: i.toString(),
  value: `Item ${i}`,
}));

export async function getItems({
  start,
  limit,
}: {
  start: number;
  limit: number;
}) {
  return new Promise<Items>((resolve) => {
    setTimeout(() => {
      resolve(localItems.slice(start, start + limit));
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
      let index = localItems.findIndex((i) => i.id === after);
      resolve(localItems.slice(index, index + limit));
    }, 500);
  });
}

export async function getIndexFor({ id }: { id: string }) {
  return new Promise<number>((resolve) => {
    setTimeout(() => {
      let index = localItems.findIndex((item) => {
        let result = item.id === id;
        if (result) {
        }
        return result;
      });

      resolve(index);
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
      resolve(localItems.slice(start, start + limit));
    }, 500);
  });
}

export async function countItems() {
  return new Promise<number>((resolve) => {
    setTimeout(() => {
      resolve(localItems.length);
    }, 500);
  });
}
