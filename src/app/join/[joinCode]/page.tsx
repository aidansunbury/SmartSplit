import { redirect } from "next/navigation";
import { api } from "~/trpc/server";

export default async function JoinPage({
  params,
}: { params: { joinCode: string } }) {
  let redirectPath = "";
  try {
    const joinResult = await api.group.join({
      joinCode: params.joinCode,
    });
    redirectPath = `/dashboard?group=${joinResult.id}&join=success`;
  } catch (error) {
    redirectPath = "/dashboard?join=error";
  }
  redirect(redirectPath);
}
