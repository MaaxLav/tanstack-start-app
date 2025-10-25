import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/tanstack-query")({
  component: TanStackQueryDemo,
});

type Todo = {
  id: number;
  name: string;
};

function TanStackQueryDemo() {
  //* USE OF Tanstack Query - is best for dynamic data that changes often(dashboards, etc)
  const queryClient = useQueryClient();
  //? useQuery
  // used for fetching, caching, synchronizing(refetching) data
  const { data, refetch } = useQuery<Todo[]>({
    queryKey: ["todos"],
    //? instead of using server func in loader it fetches the data directly from the api route
    // to create api route just create a file in routes and start it with api.(api.names as example)
    queryFn: () => fetch("/demo/api/tq-todos").then((res) => res.json()),
    initialData: [],
    staleTime: 1000 * 60 * 1, // 1 minutes(for one minute it will take data from cache and then it will allow to refetch data when component mounts or manually by calling refetch)
  });

  //? useMutation
  // used for creating/updating/deleting data
  const { mutate: addTodo } = useMutation({
    mutationFn: (todo: string) =>
      fetch("/demo/api/tq-todos", {
        method: "POST",
        body: JSON.stringify(todo),
      }).then((res) => res.json()),
    //? manual refetch after mutation
    onSuccess: () => {
      refetch();
      //? if it would be separate component we could use
      // queryClient.invalidateQueries({queryKey: ['todos']}) to refetch the data
    },
    //? optimistic update
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      queryClient.setQueryData(["todos"], (pV: any[]) => [...pV, newTodo]);
      const previousTodos = queryClient.getQueryData(["todos"]);

      return { previousTodos };
    },
    // in case of server error rollback to previous data
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(["todos"], context?.previousTodos);
    },
  });

  const [todo, setTodo] = useState("");

  const submitTodo = useCallback(async () => {
    await addTodo(todo);
    setTodo("");
  }, [addTodo, todo]);

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black p-4 text-white"
      style={{
        backgroundImage:
          "radial-gradient(50% 50% at 80% 20%, #3B021F 0%, #7B1028 60%, #1A000A 100%)",
      }}
    >
      <div className="w-full max-w-2xl p-8 rounded-xl backdrop-blur-md bg-black/50 shadow-xl border-8 border-black/10">
        <h1 className="text-2xl mb-4">TanStack Query Todos list</h1>
        <ul className="mb-4 space-y-2">
          {data?.map((t) => (
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
