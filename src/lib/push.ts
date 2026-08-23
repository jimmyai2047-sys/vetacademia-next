import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { prisma } from "@/lib/prisma";

const expo = new Expo();

async function deliver(tokens: string[], title: string, body: string, data: Record<string, any> = {}) {
  const pushTokens = tokens.filter((t) => Expo.isExpoPushToken(t));
  if (pushTokens.length === 0) return { sent: 0 };
  const messages: ExpoPushMessage[] = pushTokens.map((to) => ({
    to,
    sound: "default",
    title,
    body,
    data,
  }));
  let sent = 0;
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      sent += tickets.length;
    } catch (e) {
      console.error("Expo push error:", e);
    }
  }
  return { sent };
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data: Record<string, any> = {}
) {
  const rows = await prisma.deviceToken.findMany({
    where: { userId },
    select: { token: true },
  });
  return deliver(
    rows.map((r) => r.token),
    title,
    body,
    data
  );
}

export async function sendPushToAll(
  title: string,
  body: string,
  data: Record<string, any> = {}
) {
  const rows = await prisma.deviceToken.findMany({ select: { token: true } });
  return deliver(
    rows.map((r) => r.token),
    title,
    body,
    data
  );
}
