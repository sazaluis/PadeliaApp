import prismadb from "@/lib/prisma";

interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(data: CreateNotificationInput) {
  return prismadb.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
    },
  });
}