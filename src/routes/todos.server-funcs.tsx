import fs from "node:fs";
import { useCallback, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/middlewares";

/*
const loggingMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    console.log("Request:", request.url);
    return next();
  }
);
const loggedServerFunction = createServerFn({ method: "GET" }).middleware([
  loggingMiddleware,
]);
*/

const TODOS_FILE = "todos.json";

//Function on the server with access to DB for example
async function readTodos() {
  return JSON.parse(
    await fs.promises.readFile(TODOS_FILE, "utf-8").catch(() =>
      JSON.stringify(
        [
          { id: 1, name: "Get groceries" },
          { id: 2, name: "Buy a new phone" },
        ],
        null,
        2
      )
    )
  );
}

//? Server Functions (could be runtime/static)
// Called on server only
// Similar to API endpoint, but without a need to create an actual API route on separate server
// Except of being used to fetch data on server, it also useful and used for mutations (POST, PUT, DELETE requests)
// Basically serve function that is called during runtime from client

// runtime SF
const getTodos = createServerFn({
  method: "GET",
})
  // .middleware([authMiddleware])
  .handler(async () => await readTodos());

//? STATIC SF (for example pre-rendered pages)
// Called once during build time to fetch static data that doesn't change often
// Serve static content after being called during build time
// const getTodos = createServerFn({
//   method: "GET",
//   type: "static",
// }).handler(async () => await readTodos());

// runtime SF
const addTodo = createServerFn({ method: "POST" })
  //adding middlewares, they work the same as for API route
  .middleware([authMiddleware])
  //we could use here joi/yup/zon etc to validate payload
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const todos = await readTodos();
    todos.push({ id: todos.length + 1, name: data });
    await fs.promises.writeFile(TODOS_FILE, JSON.stringify(todos, null, 2));
    return todos;
  });
//

export const Route = createFileRoute("/todos/server-funcs")({
  component: Home,
  beforeLoad: async () => {
    //? beforeLoad - can be used for auth checks, so in case of failure we can redirect before even trying to load data
  },
  loader: async () =>
    // runs on server first
    // so until data is fetched the component won't be rendered

    await getTodos(),
});

function Home() {
  //* USE OF SERVER FUNCTION - is best for SSR, which is for constant data that doesn't change often and important to SEO

  const router = useRouter();
  let todos = Route.useLoaderData();

  const [todo, setTodo] = useState("");

  const submitTodo = useCallback(async () => {
    // try catch to handle errors from server function and its middlewares, same as for API route
    try {
      todos = await addTodo({ data: todo });
      setTodo("");
      router.invalidate();
    } catch (error) {
      alert("Error adding todo: " + (error as Error).message);
    }
  }, [addTodo, todo]);

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-800 to-black p-4 text-white"
      style={{
        backgroundImage:
          "radial-gradient(50% 50% at 20% 60%, #23272a 0%, #18181b 50%, #000000 100%)",
      }}
    >
      <div className="w-full max-w-2xl p-8 rounded-xl backdrop-blur-md bg-black/50 shadow-xl border-8 border-black/10">
        <h1 className="text-2xl mb-4">Start Server Functions - Todo Example</h1>
        <ul className="mb-4 space-y-2">
          {todos?.map((t) => (
            <li
              key={t.id}
              className="bg-white/10 border border-white/20 rounded-lg p-3 backdrop-blur-sm shadow-md"
            >
              <span className="text-lg text-white">{t.name}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={todo}
            onChange={(e) => setTodo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                submitTodo();
              }
            }}
            placeholder="Enter a new todo..."
            className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          <button
            disabled={todo.trim().length === 0}
            onClick={submitTodo}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Add todo
          </button>
        </div>
      </div>
    </div>
  );
}
