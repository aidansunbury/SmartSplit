"use client";
import { useQueryState } from "nuqs";

import { SearchInput } from "./SearchBar";
import { Feed } from "./Feed";
import { Members } from "./Members";
import { AddExpense } from "./AddExpense";
import { AddPayment } from "./AddPayment";

// If the user is not a part of any groups, CTA to create or join
export default function DashboardPage() {
  const [group, setGroup] = useQueryState("group");

  return (
    <div className="flex min-h-screen justify-center overflow-hidden">
      {/* Main content area */}
      <div className="w-full max-w-[600px] p-4">
        <div className="text-center text-gray-600">
          <SearchInput />
          <div>
            <AddExpense />
            <AddPayment />
            {/* //Todo Invite Group member */}
          </div>
          <Feed />
        </div>
      </div>

      {/* Right gutter */}
      <div className="w-56 p-4 shadow-xl">
        <div className="text-pretty text-gray-600">
          <Members />
        </div>
      </div>
    </div>
  );
}
