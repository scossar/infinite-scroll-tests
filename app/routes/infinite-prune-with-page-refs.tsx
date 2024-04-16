/**
 * Copying this here because I might want to look at the pagesRef implementation in the future.
 */

import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import debounce from "debounce";

import { createRef, useEffect, useRef, useState } from "react";

import type { Item, Items } from "~/utils/backendAlt.server";
import { getItems, getIndexFor } from "~/utils/backendAlt.server";
import CopyButton from "~/components/CopyButton";

const LIMIT = 7;

type PagedItem = {
  [page: string]: Items;
};

type PagedItems = {
  [page: string]: Items;
};

type FetcherData = {
  pagedItems: PagedItems;
};

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

  const viewedPageRef = useRef(Object.keys(pagedItems)[0]);
  const pagesRef = useRef<{ [key: string]: React.RefObject<HTMLDivElement> }>(
    {}
  );

  useEffect(() => {
    Object.keys(pages).forEach((page) => {
      if (!pagesRef.current[page]) {
        pagesRef.current[page] = createRef();
      }
    });
  }, [pages]);

  function getTopPageId(clientHeight: number): string | null {
    const visiblePage = Object.entries(pagesRef.current).find(([key, ref]) => {
      const rect = ref.current?.getBoundingClientRect();
      if (rect) {
        // this is very approximate:
        const isWithinBounds = rect.bottom > 0 && rect.top < clientHeight;
        return isWithinBounds;
      }
      return false;
    });
    return visiblePage ? visiblePage[0] : null; // Return the key of the visible page
  }

  useEffect(() => {
    if (fetcher?.data && fetcher.data?.pagedItems) {
      let summedPages = { ...pages, ...fetcher.data.pagedItems };

      setPages(summedPages);
      console.log(`prunedPages: ${JSON.stringify(pages, null, 2)}`);
    }
  }, [fetcher.data?.pagedItems]);

  const prunePages = (pages: PagedItems) => {
    if (Object.keys.length > 5) return pages;
  };

  function removeFirstPage(pages: PagedItems) {
    const [firstKey, ...restKeys] = Object.keys(pages);
    const { [firstKey]: _, ...prunedPages } = pages; // _ is a discard variable for the first property
    return prunePages;
  }

  function removeLastPage(pages: PagedItems) {
    const keys = Object.keys(pages);
    const lastKey = keys[keys.length - 1];
    const { [lastKey]: _, ...prunedPages } = pages; // Exclude the last property
    return prunePages;
  }

  const debouncedHandleScroll = debounce(
    (scrollHeight: number, scrollTop: number, clientHeight: number) => {
      const foundPageId = getTopPageId(clientHeight);
      viewedPageRef.current = foundPageId ? foundPageId : viewedPageRef.current;
      console.log(`viewedPageRef.current: ${viewedPageRef.current}`);
      const scrolledToBottom = scrollTop + 10 + clientHeight >= scrollHeight;
      if (scrolledToBottom && fetcher.state === "idle") {
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
            <div key={page} ref={pagesRef.current[page]} data-id={page}>
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
