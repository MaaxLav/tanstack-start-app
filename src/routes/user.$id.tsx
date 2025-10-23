import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/user/$id")({
  component: RouteComponent,
  // (Similar to interceptor in Angular) Called before the route loader function(preferably for auth checks)
  beforeLoad: () => {},
  // (Similar to Angular route data resolver) For fetching route data.
  // Called before route loaded, but just when it is recognized,
  // It exist on client and on sever at the same time
  loader: async ({ params }) => {
    const res = await fetch(
      "https://jsonplaceholder.typicode.com/users/" + params.id
    );

    if (!res.ok) throw new Error("Failed to fetch user data");

    const user = await res.json();
    if (!user.id) throw notFound();

    // console.log("Server user id:", user.id);
    return { user };
  },
  notFoundComponent: () => <div>User not found</div>,
  errorComponent: ({ error }) => (
    <div className="text-red-500">Error: {error.message}</div>
  ),
  pendingComponent: () => <div>Loading user data...</div>,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  // console.log("Client user id:", data.user.id);

  return (
    <div>
      <h1>User Page</h1>
      <div>
        User ID: {data.user.id}, User Name: {data.user.name}, email:{" "}
        {data.user.email}
      </div>
    </div>
  );
}
