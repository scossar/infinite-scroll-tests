import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";

import { FixedSizeList as List } from "react-window";

import { getItems } from "~/utils/backendAlt.server";
import type { Items } from "~/utils/backendAlt.server";

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

const Item = ({
  index,
  style,
  data,
}: {
  index: number;
  style: React.CSSProperties;
  data: Items;
}) => <div style={style}>{data[index].value}</div>;

export default function FixedSizeListBasic() {
  const { pagedItems } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<FetcherData>();
  const pageRef = useRef(Number(Object.keys(pagedItems)[0]));
  const [pages, setPages] = useState(pagedItems);
  const flattenedPagesRef = useRef(Object.values(pages).flat(1)); // not required here, but calling `flat(1)` will prevent nexted arrays from  being flattened
  const [itemCount, setItemCount] = useState(flattenedPagesRef.current.length);

  useEffect(() => {
    flattenedPagesRef.current = Object.values(pages).flat(1);
    setItemCount(flattenedPagesRef.current.length);
  }, [pages]);

  useEffect(() => {
    if (fetcher?.data && fetcher.data?.pagedItems) {
      let summedPages = { ...pages, ...fetcher.data.pagedItems };
      setPages(summedPages);
    }
  }, [fetcher?.data?.pagedItems]);

  function handleSubmit() {
    if (fetcher.state === "idle") {
      pageRef.current += 1;
      fetcher.load(`/fixed-size-list-basic?page=${pageRef.current}`);
    }
  }

  return (
    <div className="max-w-screen-sm mx-auto">
      <h1>React Window</h1>
      <List
        className="my-8"
        height={400}
        itemCount={itemCount}
        itemSize={70}
        width={600}
        itemData={flattenedPagesRef.current}
      >
        {Item}
      </List>
      <button type="submit" onClick={handleSubmit}>
        Load More
      </button>
    </div>
  );
}
