import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { json, useActionData } from "@remix-run/react";
import { useMatches, useOutletContext } from "@remix-run/react";

export default function InfiniteWithIdsItemId() {
  return (
    <div>
      <h1 className="bg-purple-700 text-white text-2xl">
        this is the child route
      </h1>
    </div>
  );
}
