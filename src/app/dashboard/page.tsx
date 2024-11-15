"use client";
import { useQueryState } from "nuqs";

import { SearchInput } from "./SearchBar";

// If the user is not a part of any groups, CTA to create or join
export default function DashboardPage() {
  const [group, setGroup] = useQueryState("group");

  return (
    <div className="flex h-full flex-col items-center gap-4">
      <SearchInput />
      child page
    </div>
  );
}
