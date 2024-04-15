import type { ActionFunctionArgs } from "@remix-run/node";
import { Form } from "@remix-run/react";

export async function action() {
  console.log("the button was clicked");

  // on the off chance that I accidentally commit this, it's from my local dev environment
  // just doing a quick test
  const apiKey = "";
  const apiUsername = "system";
  const baseUrl = "http://localhost:4200";
  const headers = new Headers();
  headers.append("Api-Key", apiKey);
  headers.append("Api-Username", apiUsername);
  headers.append("Content-Type", "application/json");
  const groupId = 46;
  const groupName = "publishers";

  const body = {
    usernames: "sally,Ben",
    //group_id: groupName,
  };
  const addToGroupUrl = `${baseUrl}/groups/${groupId}/members.json`;

  const response = await fetch(addToGroupUrl, {
    method: "PUT",
    headers: headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.log(`response: ${response.status}`);
  }

  const addToGroupsResponse = await response.json();
  console.log(JSON.stringify(addToGroupsResponse, null, 2));

  return null;
}

export default function AddToGroupTest() {
  return (
    <div>
      <Form method="post">
        <button type="submit">Add to group</button>
      </Form>
    </div>
  );
}
