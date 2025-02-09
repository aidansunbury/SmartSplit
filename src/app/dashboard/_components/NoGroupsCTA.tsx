import { Users } from "lucide-react";

export const NoGroupsCTA = () => {
  return (
    <section className="mt-16 text-center">
      <Users className="mx-auto" size={64} />
      <h1 className="mb-4 font-semibold text-3xl text-foreground">
        No Groups Yet
      </h1>
      <p className="mb-8 text-accent-foreground text-gray-600">
        Create or join a group using the buttons on the sidebar.
      </p>
    </section>
  );
};
