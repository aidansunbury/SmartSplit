"use client";
import { useQueryState } from "nuqs";

import { SearchInput } from "./SearchBar";
import { Feed } from "./Feed";
import { Members } from "./Members";

// If the user is not a part of any groups, CTA to create or join
export default function DashboardPage() {
  const [group, setGroup] = useQueryState("group");

  return (
    <div className="flex min-h-screen justify-center overflow-hidden">
      {/* Main content area */}
      <div className="w-full max-w-[600px] p-4">
        <div className="text-center text-gray-600">
          <SearchInput />
          <Feed />
        </div>
      </div>

      {/* Right gutter */}
      <div className="hidden w-48 p-4 lg:block">
        <div className="text-pretty text-gray-600">
          <Members />
        </div>
      </div>
    </div>
  );
}
