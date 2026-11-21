
import { MdSearch, MdClose } from "react-icons/md";

function HelpSearch({ search, setSearch }) {
  return (
    <div className="help-search">
      <MdSearch size={19} />

      <input
        type="text"
        placeholder="Search for articles, topics or questions..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {search && (
        <button
          type="button"
          className="help-search-clear"
          onClick={() => setSearch("")}
          aria-label="Clear search"
        >
          <MdClose size={17} />
        </button>
      )}
    </div>
  );
}

export default HelpSearch;
