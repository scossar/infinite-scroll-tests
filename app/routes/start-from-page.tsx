import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import debounce from "debounce";

import { useEffect, useRef, useState } from "react";

import type { Items } from "~/utils/backendAlt.server";
import { getItems, getIndexFor } from "~/utils/backendAlt.server";
import CopyButton from "~/components/CopyButton";

const LIMIT = 10;

type FetcherData = {
  items: Items;
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

  return json({ items, initialPage: page });
}

export default function StartFromPage() {
  const { items, initialPage } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<FetcherData>();
  const [currentItems, setCurrentItems] = useState(items);
  const forwardPageRef = useRef(0);
  const backwardPageRef = useRef(0);
  const loadingDirRef = useRef<LoadingDirection>("forward");

  useEffect(() => {
    if (fetcher?.data && fetcher.data?.items) {
      setCurrentItems(
        loadingDirRef.current === "forward"
          ? currentItems.concat(fetcher.data.items)
          : fetcher.data.items.concat(currentItems)
      );
    }
  }, [fetcher.data?.items]);

  const debouncedHandleScroll = debounce(
    (scrollHeight: number, scrollTop: number, clientHeight: number) => {
      const scrolledToBottom = scrollTop + 10 + clientHeight >= scrollHeight;
      if (scrolledToBottom && fetcher.state === "idle") {
        loadingDirRef.current = "forward";
        forwardPageRef.current += 1;
        const nextPage = initialPage
          ? initialPage + forwardPageRef.current
          : forwardPageRef.current;
        fetcher.load(`/start-from-page?page=${nextPage}`);
      }
      if (scrollTop === 0 && fetcher.state === "idle") {
        loadingDirRef.current = "backward";
        const tryPageFromRef = backwardPageRef.current - 1;
        const previousPage = initialPage
          ? initialPage + tryPageFromRef
          : tryPageFromRef;
        if (previousPage >= 0) {
          backwardPageRef.current -= 1;
          fetcher.load(`/start-from-page?page=${previousPage}`);
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
    <div className="max-w-screem-sm mx-auto">
      <h1>Start From Page</h1>
      <div className="relative">
        <div
          className="overflow-y-scroll max-h-96 mt-6 divide-y divide-slate-300"
          onScroll={handleScroll}
        >
          {currentItems?.map((item) => (
            <div key={item.id} className="px-3 py-6">
              <p>{item.value}</p>
              <CopyButton
                url={`http://localhost:5173/start-from-page?lastSeenId=${item.id}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
