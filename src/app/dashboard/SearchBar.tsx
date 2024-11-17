import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const SearchBar = ({
  searchTerm,
  setSearchTerm,
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}) => {
  return (
    <div className="mb-4">
      <div className="relative">
        <Input
          id="input-26"
          className="peer ps-9 pe-1"
          placeholder="Search by title or member name..."
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
          <Search size={16} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
