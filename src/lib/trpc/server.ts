import "server-only";

import { headers } from "next/headers";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/trpc";

export const api = async () => {
  const headersList = await headers();
  return createCaller(
    await createTRPCContext({
      headers: headersList,
    })
  );
};
