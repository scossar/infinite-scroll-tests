import type { Items } from "~/utils/backendAlt.server";

type PagedItems = {
  [page: string]: Items;
};

type ItemProps = {
  style: React.CSSProperties;
  index: number;
  pagedItems: PagedItems;
};

export default function Item({ style, index, pagedItems }: ItemProps) {
  return (
    <div style={style}>
      {Object.entries(pagedItems).map(([page, items]) => (
        <div key={page}>
          <div key={index}>{items[index].value}</div>
        </div>
      ))}
    </div>
  );
}
