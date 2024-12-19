import { NextResponse } from "next/server";
import { renderTrpcPanel } from "trpc-ui";
import { appRouter } from "~/server/api/root";

export async function GET(req: Request) {
  return new NextResponse(
    renderTrpcPanel(appRouter, {
      url: "/api/trpc",
      transformer: "superjson",
      meta: {
        title: "Smart Split",
      },
    }),
    {
      status: 200,
      headers: [["Content-Type", "text/html"] as [string, string]],
    },
  );
}
