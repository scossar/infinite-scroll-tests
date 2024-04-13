import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Outlet,
  useFetcher,
  useLoaderData,
  useNavigate,
} from "@remix-run/react";
import type { ShouldRevalidateFunction } from "@remix-run/react";
import {
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Item, Items } from "~/utils/backend.server";
import { getItems } from "~/utils/backend.server";

import debounce from "debounce";

const LIMIT = 60;

/**
 * imported from backend.server.ts
 * type Item = {id: string; value: string;};
 */
type FetcherData = {
  items: Items;
};

type ItemRefs = HTMLDivElement[];

export const shouldRevalidate: ShouldRevalidateFunction = ({
  actionResult,
  currentParams,
  currentUrl,
  defaultShouldRevalidate,
  formAction,
  formData,
  formEncType,
  formMethod,
  nextParams,
  nextUrl,
}) => {
  return defaultShouldRevalidate;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 0;
  const start = page * LIMIT;
  const items = await getItems({ start: start, limit: LIMIT });
  console.log("infinte loader called");

  return json({ items });
}

export default function InfiniteWithIds() {
  //console.log("infinte-with-item-ids-rendered");
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher<FetcherData>();
  const idFetcher = useFetcher();
  const [items, setItems] = useState(data.items);
  const page = useRef(0);
  let loading = fetcher.state === "loading";
  const navigate = useNavigate();
  const clientHeightRef = useRef(0);
  // const [navigated, setNavigated] = useState(false);
  const navigatedRef = useRef(false);

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
        {item.value}
      </div>
    ));
  }, [items, itemRefs]);

  useEffect(() => {
    if (fetcher?.data && fetcher.data?.items) {
      const allItems = items.concat(fetcher.data.items);
      setItems(allItems);
    }
  }, [fetcher.data?.items]);

  const debouncedHandleScroll = debounce(
    (scrollHeight: number, scrollTop: number, clientHeight: number) => {
      const itemId = getTopItemId(clientHeight);

      if (itemId && navigatedRef.current === false) {
        //setNavigated(true);
        navigatedRef.current = true;
        console.log("this shouldn't get called more than once");
        navigate(`/infinite-with-item-ids/${itemId}`, { replace: true });
        // navigate(`?itemId=${itemId}`, { replace: true });
      }
      if (itemId && navigatedRef.current) {
      }

      const scrolledToBottom = scrollTop + 10 + clientHeight >= scrollHeight;
      if (scrolledToBottom && fetcher.state === "idle") {
        page.current += 1;
        fetcher.load(`/infinite-with-item-ids?page=${page.current}`);
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
    clientHeightRef.current = clientHeight;
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
          className="overflow-y-scroll max-h-96 mt-6 divide-y divide-slate-300"
          onScroll={handleScroll}
        >
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
      <Outlet />
    </div>
  );
}
