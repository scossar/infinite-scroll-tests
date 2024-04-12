import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData, useLocation } from "@remix-run/react";
import { countItems, getItems } from "~/utils/backend.server";

const LIMIT = 10;

type Item = {
  id: string;
  value: string;
};
type Items = Item[];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 0;
  const start = page * LIMIT;
  const nextPage = page + 1;
  const items = await getItems({ start: start, limit: LIMIT });
  const totalItems = await countItems();

  return json({ items, totalItems, nextPage });
}

export default function LoadMore() {
  const data = useLoaderData<typeof loader>();
  const location = useLocation();
  const newItems: Items = data.items;
  const previousItems: Items = location.state?.items;
  const currentItems: Items = previousItems
    ? previousItems?.concat(newItems)
    : newItems;

  return (
    <div className="max-w-screen-md mx-auto">
      <h1>Load More Data</h1>
      <p>
        Concatenate previous and new items when the "Next Page" button is
        clicked. Items are maintained in the browser's History `state` property.
      </p>
      <div>
        {currentItems.map((item) => (
          <div key={item.id}>{item.value}</div>
        ))}
      </div>
      <Link to={`?page=${data.nextPage}`} state={{ items: currentItems }}>
        Next Page
      </Link>
    </div>
  );
}
