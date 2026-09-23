"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createTodo, deleteTodo } from "@/app/admin/todos/actions";

export type TodoBoardItem = {
  id: string;
  text: string;
  createdAt: string; // sérialisé pour passer d'un composant serveur au client
  author: { name: string; avatarUrl: string | null };
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TodoBoard({
  initialTodos,
  viewAllHref,
}: {
  initialTodos: TodoBoardItem[];
  viewAllHref?: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function add() {
    const value = text.trim();
    if (!value) return;
    setErr(null);
    startTransition(async () => {
      const r = await createTodo(value);
      if (r.ok) {
        setText("");
        router.refresh();
      } else {
        setErr(r.error ?? "Échec de l'enregistrement.");
      }
    });
  }

  function remove(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      await deleteTodo(id);
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-stone-100 p-5">
        <h2 className="font-semibold">Todo de l&apos;agence</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-sm font-medium text-primary-600">
            Tout voir →
          </Link>
        )}
      </div>

      <div className="flex gap-3 p-5">
        <input
          className="input flex-1"
          placeholder="Écrire une note…"
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              add();
            }
          }}
        />
        <button
          type="button"
          onClick={add}
          disabled={pending || !text.trim()}
          className="btn-primary shrink-0"
        >
          Ajouter
        </button>
      </div>
      {err && <p className="px-5 pb-3 text-sm text-red-600">{err}</p>}

      {initialTodos.length === 0 ? (
        <p className="border-t border-stone-100 p-5 text-sm text-stone-500">
          Aucune note pour le moment.
        </p>
      ) : (
        <ul className="divide-y divide-stone-100 border-t border-stone-100">
          {initialTodos.map((todo) => (
            <li key={todo.id} className="flex items-start gap-3 p-5">
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-stone-200">
                {todo.author.avatarUrl ? (
                  <Image
                    src={todo.author.avatarUrl}
                    alt={todo.author.name}
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs font-medium text-stone-500">
                    {todo.author.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap break-words text-sm text-stone-800">
                  {todo.text}
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  {todo.author.name} · {formatDateTime(todo.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(todo.id)}
                disabled={pending && deletingId === todo.id}
                className="shrink-0 text-xs font-medium text-stone-400 hover:text-red-600"
              >
                {deletingId === todo.id ? "…" : "Supprimer"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
