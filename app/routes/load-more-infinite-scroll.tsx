import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useFetcher,
  Link,
  useLoaderData,
  useLocation,
  useNavigation,
} from "@remix-run/react";
import { getItems } from "~/utils/backend.server";
import { useCallback, useEffect, useState, useRef } from "react";

import debounce from "debounce";

const LIMIT = 30;
const DATA_OVERSCAN = 40;

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
  const [shouldRestScroll, setShouldRestScroll] = useState(false);
  const page = useRef(0);
  const parentRef = useRef<HTMLDivElement>(null); // might need this to reset scrollTop after new data has been loaded?

  useEffect(() => {
    if (fetcher.data?.nextPage && fetcher.data?.items) {
      const allItems = items.concat(fetcher.data.items);
      setItems(allItems);
    }
  }, [fetcher.data?.items]);

  useEffect(() => {
    if (shouldRestScroll && parentRef.current) {
      console.log("scroll into view");
      parentRef.current.scrollIntoView({});
      // parentRef.current.scrollTop = 0;
    }
  }, [items, shouldRestScroll]);

  const debouncedHandleScroll = debounce(
    (scrollHeight: number, scrollTop: number, clientHeight: number) => {
      const scrollBottom = scrollHeight - scrollTop <= clientHeight + 10;
      if (scrollBottom && fetcher.state === "idle") {
        page.current += 1;
        fetcher.load(`/load-more-infinite-scroll?page=${page.current}`);
        setShouldRestScroll(true);
      }
    },
    200
  );

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    debouncedHandleScroll(
      target.scrollHeight,
      target.scrollTop,
      target.clientHeight
    );
  }

  return (
    <div className="max-w-screen-md mx-auto">
      <h1>Load More Data</h1>
      <p>
        Concatenate previous and new items when the "Next Page" button is
        clicked. New items are concatenated with previous items that have been
        maintained with the React `useState` hook.
      </p>
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="item-div overflow-y-scroll max-h-96 bg-blue-900 p-4 text-slate-50 w-full border border-slate-300"
      >
        {items.map((item, i) => (
          <div key={i}>{item.value}</div>
        ))}
        <div
          className={`${
            fetcher.state === "loading" ? "block" : "hidden"
          } bg-blue-500 h-9 transition-all text-center`}
        >
          Loading
        </div>
      </div>
    </div>
  );
}
