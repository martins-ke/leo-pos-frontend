
import { MdArrowOutward } from "react-icons/md";

function HelpArticleCard({ article, onClick }) {
  return (
    <button
      type="button"
      className="help-article-card"
      onClick={onClick}
    >
      <div className="help-card-top">
        <span className="help-article-icon">
          {article.icon}
        </span>

        <MdArrowOutward size={18} className="help-card-arrow" />
      </div>

      <span className="help-article-category">
        {article.category}
      </span>

      <h3>{article.title}</h3>

      <p>{article.description}</p>

      <span className="help-read-more">
        Read article
      </span>
    </button>
  );
}

export default HelpArticleCard;
