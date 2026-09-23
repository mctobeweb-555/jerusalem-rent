import { prisma } from "@/lib/db";

export type TodoItem = {
  id: string;
  text: string;
  createdAt: Date;
  author: { name: string; avatarUrl: string | null };
};

export async function listTodos(agencyId: string, take?: number): Promise<TodoItem[]> {
  return prisma.todo.findMany({
    where: { agencyId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      text: true,
      createdAt: true,
      author: { select: { name: true, avatarUrl: true } },
    },
  });
}
