import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import debounce from "debounce";

import { useEffect, useRef, useState } from "react";

import type { Items } from "~/utils/backendAlt.server";
import { getItems, getIndexFor } from "~/utils/backendAlt.server";

const LIMIT = 50;

type PagedItems = {
  [page: string]: Items;
};

type FetcherData = {
  pagedItems: PagedItems;
};

type LoadingDirection = "forward" | "backward";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const pageParam = url.searchParams.get("page");
  const lastSeenId = url.searchParams.get("lastSeenId");

  let page;

  if (pageParam !== null) {
    const parsedPage = Number(pageParam);
    page = !isNaN(parsedPage) ? parsedPage : 0;
  }

  if (lastSeenId !== null && page === undefined) {
    const lastSeenIndex = await getIndexFor({ id: lastSeenId });
    if (lastSeenIndex >= 0) {
      page = Math.floor(lastSeenIndex / LIMIT);
    } else {
      page = 0;
    }
  }

  page = page !== undefined ? page : 0;

  const start = page * LIMIT;
  const items = await getItems({ start, limit: LIMIT });
  const pagedItems = {
    [page]: items,
  };

  return json({ pagedItems, initialPage: page });
}

export default function InfinitePrune() {
  const { pagedItems, initialPage } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<FetcherData>();
  const [pages, setPages] = useState(pagedItems);
  const forwardPageRef = useRef(0); // tracks how many pages forward have been requested
  const backwardPageRef = useRef(0); // tracks how many pages backward have been requested
  const loadingDirRef = useRef<LoadingDirection>("forward"); // "forward" or "backward", needed to adjust forward/backward pageRefs in prune function

  useEffect(() => {
    if (fetcher?.data && fetcher.data?.pagedItems) {
      let summedPages = { ...pages, ...fetcher.data.pagedItems };
      summedPages = prunePages(summedPages);
      setPages(summedPages);
    }
  }, [fetcher.data?.pagedItems]);

  const prunePages = (pages: PagedItems) => {
    let pruned;
    if (Object.keys(pages).length > 5) {
      if (loadingDirRef.current === "forward") {
        pruned = removeFirstPage(pages);
        backwardPageRef.current += 1;
      } else {
        pruned = removeLastPage(pages);
        forwardPageRef.current -= 1;
      }
    }

    return pruned ? pruned : pages;
  };

  function removeFirstPage(pages: PagedItems) {
    const [firstKey, ...restKeys] = Object.keys(pages);
    const { [firstKey]: _, ...prunedPages } = pages; // _ is a discard variable for the first property
    return prunedPages;
  }

  function removeLastPage(pages: PagedItems) {
    const keys = Object.keys(pages);
    const lastKey = keys[keys.length - 1];
    const { [lastKey]: _, ...prunedPages } = pages; // Exclude the last property
    return prunedPages;
  }

  const debouncedHandleScroll = debounce(
    (scrollHeight: number, scrollTop: number, clientHeight: number) => {
      const scrolledToBottom = scrollTop + 10 + clientHeight >= scrollHeight;
      if (scrolledToBottom && fetcher.state === "idle") {
        loadingDirRef.current = "forward";
        forwardPageRef.current += 1;
        const nextPage = initialPage
          ? initialPage + forwardPageRef.current
          : forwardPageRef.current;
        fetcher.load(`/infinite-prune?page=${nextPage}`);
      }
      if (scrollTop === 0 && fetcher.state === "idle") {
        const tryPageFromRef = backwardPageRef.current - 1;
        const previousPage = initialPage
          ? initialPage + tryPageFromRef
          : tryPageFromRef;
        if (previousPage >= 0) {
          loadingDirRef.current = "backward";
          backwardPageRef.current -= 1;
          fetcher.load(`/infinite-prune?page=${previousPage}`);
        }
      }
    }
  );

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const currentTarget = event.currentTarget;
    const scrollHeight = currentTarget.scrollHeight;
    const scrollTop = currentTarget.scrollTop;
    const clientHeight = currentTarget.clientHeight;
    debouncedHandleScroll(scrollHeight, scrollTop, clientHeight);
  }

  return (
    <div className="max-w-screen-sm mx-auto">
      <h1>Infinite Prune</h1>
      <div className="relative">
        <div
          className="overflow-y-scroll max-h-96 mt-6 divide-y divide-slate-300"
          onScroll={handleScroll}
        >
          {Object.entries(pages).map(([page, items]) => (
            <div key={page}>
              {items.map((item) => (
                <div key={item.id} className="px-3 py-6">
                  <p>{item.value}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
