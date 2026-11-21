
import { MdFolderOpen } from "react-icons/md";

function HelpCategories({
  categories,
  selectedCategory,
  setSelectedCategory
}) {
  return (
    <div className="help-categories">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          className={`help-category-btn ${
            selectedCategory === category ? "active" : ""
          }`}
          onClick={() => setSelectedCategory(category)}
        >
          {category === "All" && <MdFolderOpen size={15} />}
          {category}
        </button>
      ))}
    </div>
  );
}

export default HelpCategories;
