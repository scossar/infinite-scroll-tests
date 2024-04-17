import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { VariableSizeList as List, VariableSizeList } from "react-window";

import { getItems } from "~/utils/backendIpsum.server";
import type { Items } from "~/utils/backendIpsum.server";

const LIMIT = 10;

type PagedItems = {
  [page: string]: Items;
};

type FetcherData = {
  pagedItems: PagedItems;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 0;
  const start = page * LIMIT;
  const items = await getItems({ start, limit: LIMIT });

  const pagedItems = {
    [page]: items,
  };

  return json({ pagedItems });
}

export default function VariableSizeListTest() {
  const { pagedItems } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<FetcherData>();
  const pageRef = useRef(Number(Object.keys(pagedItems)[0]));
  const [pages, setPages] = useState(pagedItems);
  const flattenedPagesRef = useRef(Object.values(pages).flat(1)); // not required here, but calling `flat(1)` will prevent nexted arrays from  being flattened
  const [itemCount, setItemCount] = useState(flattenedPagesRef.current.length);

  function handleSubmit() {
    if (fetcher.state === "idle") {
      pageRef.current += 1;
      fetcher.load(`/window-variable?page=${pageRef.current}`);
    }
  }

  useEffect(() => {
    flattenedPagesRef.current = Object.values(pages).flat(1);
    setItemCount(flattenedPagesRef.current.length);
  }, [pages]);

  useEffect(() => {
    if (fetcher?.data && fetcher.data?.pagedItems) {
      let summedPages = { ...pages, ...fetcher.data.pagedItems };
      setPages(summedPages);

      const newHeights = [...itemHeights];
      // This could be optimized a bit.
      const additionalItems = Object.values(fetcher.data.pagedItems).flat();
      additionalItems.forEach(() => newHeights.push(200)); // 200 is being set as the default height
      setItemHeights(newHeights);
    }
  }, [fetcher?.data?.pagedItems]);

  const listRef = useRef<VariableSizeList>(null);
  const [itemHeights, setItemHeights] = useState(Array(itemCount).fill(200));
  const getRowHeight = (index: number) => {
    const itemHeight = itemHeights[index];
    console.log(`itemHeight: ${itemHeight}`);
    return itemHeight;
  };

  // A proof of concept to show that heights can be adjusted. Don't use this!
  function estimateHeight(text: string, charsPerLine = 40, lineHeight = 20) {
    const lines = Math.ceil(text.length / charsPerLine);
    return lines * lineHeight;
  }

  const measureRow = useCallback(
    (node: HTMLDivElement | null, index: number) => {
      if (node !== null) {
        const text = node.innerText;
        const height = estimateHeight(text);
        // this will always return 200.
        //  const height = node.getBoundingClientRect().height;
        if (itemHeights[index] !== height) {
          const newHeights = [...itemHeights];
          newHeights[index] = height;
          setItemHeights(newHeights);
          if (listRef.current) {
            listRef.current.resetAfterIndex(index);
          }
        }
      }
    },
    [itemHeights]
  );

  const Item = ({
    index,
    style,
    data,
  }: {
    index: number;
    style: React.CSSProperties;
    data: Items;
  }) => {
    return (
      <div ref={(node) => measureRow(node, index)} style={style}>
        {data[index].value}
      </div>
    );
  };

  return (
    <div className="max-w-screen-sm mx-auto">
      <List
        ref={listRef}
        height={800}
        itemCount={itemCount}
        itemSize={getRowHeight}
        estimatedItemSize={200}
        width={600}
        itemData={flattenedPagesRef.current}
      >
        {Item}
      </List>

      <button
        type="submit"
        onClick={handleSubmit}
        disabled={fetcher.state !== "idle"}
      >
        Load More
      </button>
    </div>
  );
}
