import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

import type { Items } from "~/utils/backend.server";
import { getItems } from "~/utils/backendIpsum.server";

const LIMIT = 10;
// hard coded for now:
const LAST_PAGE = Math.floor(500 / LIMIT) - 1;

type FetcherData = {
  items: Items;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 0;

  const start = page * LIMIT;
  const items = await getItems({ start: start, limit: LIMIT });

  return json({ items });
}

export default function InfiniteIntersectionalObserver() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher<FetcherData>();
  const [items, setItems] = useState(data.items);
  const page = useRef(0);
  let loading = fetcher.state === "loading";

  const { ref, inView } = useInView({ threshold: 0 });

  // memoization isn't needed here
  // are there any potential issues with using it?
  const renderedItems = useMemo(() => {
    return items.map((item, index) => {
      if (index === items.length - 1) {
        return (
          <div key={item.id} ref={ref} data-id={item.id} className="px-3 py-6">
            {item.value}
          </div>
        );
      } else {
        return (
          <div key={item.id} data-id={item.id} className="px-3 py-6">
            {item.value}
          </div>
        );
      }
    });
  }, [items]);

  useEffect(() => {
    if (inView && fetcher.state === "idle" && page.current < LAST_PAGE) {
      page.current += 1;
      fetcher.load(`/infinite-intersectional-observer?page=${page.current}`);
    }
  }, [inView]);

  useEffect(() => {
    if (fetcher?.data && fetcher.data?.items) {
      const allItems = items.concat(fetcher.data.items);
      setItems(allItems);
    }
  }, [fetcher.data?.items]);

  return (
    <div className="max-w-screen-sm mx-auto">
      <h1 className="text-3xl">Infinite Intersectional Observer</h1>
      <p>
        Automatically load more data when a user scrolls to the bottom of the
        data's containing element.
      </p>
      <div className="relative">
        <div className="overflow-y-scroll max-h-96 mt-6 divide-y divide-slate-300">
          {renderedItems}
        </div>
        <div
          className={`${
            loading
              ? "transition-opacity opacity-100 duration-100"
              : "transition-opacity opacity-0 duration-100"
          } loading-message bg-sky-500 text-white text-center py-2 absolute bottom-0 left-0 right-4 rounded-sm`}
        >
          Loading
        </div>
      </div>
    </div>
  );
}
