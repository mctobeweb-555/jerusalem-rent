import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import { listTodos } from "@/lib/todos";
import TodoBoard from "@/components/admin/TodoBoard";

export const dynamic = "force-dynamic";

export default async function AdminTodosPage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (!user.agencyId) redirect("/admin");

  const todos = await listTodos(user.agencyId);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Todo</h1>
        <p className="mt-1 text-sm text-stone-500">
          Notes internes partagées par toute l&apos;agence. Supprimez une ligne une fois
          la tâche faite.
        </p>
      </div>
      <TodoBoard
        initialTodos={todos.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
