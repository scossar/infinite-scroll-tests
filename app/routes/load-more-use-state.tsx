import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, Link, useLoaderData, useLocation } from "@remix-run/react";
import { getItems } from "~/utils/backend.server";
import { useEffect, useState } from "react";

const LIMIT = 10;

type Item = {
  id: string;
  value: string;
};
type Items = Item[];
type FetcherData = {
  items: Items;
  nextPage: number;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 0;
  const start = page * LIMIT;
  const nextPage = page + 1;
  const items = await getItems({ start: start, limit: LIMIT });

  return json({ items, nextPage });
}

export default function LoadMore() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher<FetcherData>();
  const [items, setItems] = useState(data.items);
  const [nextPage, setNextPage] = useState(data.nextPage);

  useEffect(() => {
    if (fetcher.data?.nextPage && fetcher.data?.items) {
      setNextPage(fetcher.data?.nextPage);
      const allItems = items.concat(fetcher.data.items);
      setItems(allItems);
    }
  }, [fetcher.data]);

  return (
    <div className="max-w-screen-md mx-auto">
      <h1>Load More Data</h1>
      <p>
        Concatenate previous and new items when the "Next Page" button is
        clicked. New items are concatenated with previous items that have been
        maintained with the React `useState` hook.
      </p>
      <div>
        {items.map((item, i) => (
          <div key={i}>{item.value}</div>
        ))}
      </div>
      <button
        onClick={() => {
          const formData = new FormData();
          formData.append("page", String(nextPage));
          fetcher.submit(formData);
        }}
      >
        Load more posts
      </button>
    </div>
  );
}
