import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { createRef, useEffect, useMemo, useRef, useState } from "react";

import type { Item, Items } from "~/utils/backend.server";
import { getItems, getIndexFor } from "~/utils/backendAlt.server";
import CopyButton from "~/components/CopyButton";

import debounce from "debounce";

const LIMIT = 10;

type FetcherData = {
  items: Items;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  let page = Number(url.searchParams.get("page")) || 0;
  const lastSeenId = url.searchParams.get("itemId") || null;
  if (lastSeenId && page === 0) {
    const lastSeenIndex = await getIndexFor({ id: lastSeenId });
    page = Math.floor(lastSeenIndex / LIMIT);
  }

  const start = page * LIMIT;
  const items = await getItems({ start, limit: LIMIT });

  return json({ items, fromId: lastSeenId, deliveredPage: page });
}

export default function InfiniteWithVariableStart() {
  const data = useLoaderData<typeof loader>();
  let fromId = data?.fromId;
  const fetcher = useFetcher<FetcherData>();
  const [items, setItems] = useState(data.items);
  const page = useRef(0);
  const backPage = useRef(0);
  const lastSeen = useRef("0");
  const deliveredPage = data.deliveredPage;
  const loading = fetcher.state === "loading";
  const dirRef = useRef("forward");
  const itemsPrepandedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const itemRefs = useRef<React.RefObject<HTMLDivElement>[]>([]);
  itemRefs.current = items.map(
    (item: Item) => itemRefs.current[Number(item.id)] ?? createRef()
  );

  const renderedItems = useMemo(() => {
    return items.map((item) => (
      <div
        key={item.id}
        ref={itemRefs.current[Number(item.id)]}
        data-id={item.id}
        className="px-3 py-6"
      >
        <p>{item.value}</p>
        <CopyButton
          url={`http://localhost:5173/infinite-with-variable-start?itemId=${item.id}`}
        />
      </div>
    ));
  }, [items, itemRefs]);

  useEffect(() => {
    if (
      scrollRef.current &&
      dirRef.current === "backward" &&
      itemsPrepandedRef.current === true
    ) {
      // this does something, it should only happen when new items have been loaded though.
      scrollRef.current.scrollTop += scrollRef.current.clientHeight;
      itemsPrepandedRef.current = false;
      scrollRef.current.scrollIntoView;
    }
  }, [items]);

  useEffect(() => {
    if (fetcher?.data && fetcher.data?.items) {
      const allItems =
        dirRef.current === "forward"
          ? items.concat(fetcher.data.items)
          : fetcher.data.items.concat(items);
      setItems(allItems);
    }
  }, [fetcher.data?.items]);

  const debouncedHandleScroll = debounce(
    (scrollHeight: number, scrollTop: number, clientHeight: number) => {
      // this could be used to record the (approximate) last seen item for a user
      const itemId = getTopItemId(clientHeight);
      if (itemId) {
        lastSeen.current = itemId;
      }

      const scrolledToBottom = scrollTop + 10 + clientHeight >= scrollHeight;
      if (scrolledToBottom && fetcher.state === "idle") {
        // have to be careful here to not redeliver a page that's already been loaded.
        page.current += 1;
        dirRef.current = "forward";
        const nextPage = page.current + deliveredPage;
        fetcher.load(`/infinite-with-variable-start?page=${nextPage}`);
      }
      if (scrollTop === 0 && page.current + deliveredPage > 1) {
        backPage.current -= 1;
        dirRef.current = "backward";
        itemsPrepandedRef.current = true;
        const previousPage = backPage.current + deliveredPage;
        fetcher.load(`/infinite-with-variable-start?page=${previousPage}`);
        // after the data has loaded, the div that contains the item list needs to be scrolled down, ideally to the last seen item
      }
    },
    500
  );

  function getTopItemId(clientHeight: number): string | null {
    const visibleRef = itemRefs.current.find((ref) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= clientHeight;
      }
    });

    return visibleRef && visibleRef.current?.dataset?.id
      ? visibleRef.current.dataset.id
      : null;
  }

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const currentTarget = event.currentTarget;
    const scrollHeight = currentTarget.scrollHeight;
    const scrollTop = currentTarget.scrollTop;
    const clientHeight = currentTarget.clientHeight;
    debouncedHandleScroll(scrollHeight, scrollTop, clientHeight);
  }

  return (
    <div className="max-w-screen-sm mx-auto">
      <h1 className="text-3xl">Infinite</h1>
      <p>
        Automatically load more data when a user scrolls to the bottom of the
        data's containing element.
      </p>
      <div className="relative">
        <div
          className="item-content-area overflow-y-scroll max-h-96 mt-6 divide-y divide-slate-300 pb-8"
          onScroll={handleScroll}
          ref={scrollRef}
        >
          {renderedItems}
        </div>
        <div
          className={`${
            loading
              ? "transition-opacity opacity-70 duration-200"
              : "transition-opacity opacity-0 duration-200"
          } loading-message bg-sky-500 text-white text-center py-2 absolute bottom-0 left-0 right-4 rounded-sm`}
        >
          Loading
        </div>
      </div>
    </div>
  );
}
