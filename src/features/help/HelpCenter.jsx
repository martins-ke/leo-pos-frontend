
import { useMemo, useState } from "react";
import { MdMenuBook, MdHeadphones } from "react-icons/md";

import HelpSearch from "./components/HelpSearch";
import HelpCategories from "./components/HelpCategories";
import HelpArticleCard from "./components/HelpArticleCard";
import HelpArticleView from "./components/HelpArticleView";

import "./helpCenter.css";
import helpArticles from "./data/helpArticle";

function HelpCenter() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedArticle, setSelectedArticle] = useState(null);

  const categories = useMemo(
    () => ["All", ...new Set(helpArticles.map(article => article.category))],
    []
  );

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return helpArticles.filter(article => {
      const matchesCategory =
        selectedCategory === "All" ||
        article.category === selectedCategory;

      const searchableContent = [
        article.title,
        article.description,
        article.category,
        ...article.content.flatMap(section => [
          section.heading,
          ...section.steps
        ])
      ].join(" ").toLowerCase();

      return matchesCategory && searchableContent.includes(query);
    });
  }, [search, selectedCategory]);

  return (
    <div className="help-center">
      {selectedArticle ? (
        <HelpArticleView
          article={selectedArticle}
          onBack={() => setSelectedArticle(null)}
        />
      ) : (
        <>
          <header className="help-header">
            <div className="help-header-content">
              <div className="help-header-icon">
                <MdMenuBook size={25} />
              </div>

              <div>
                <span className="help-eyebrow">LEO SUPPORT</span>
                <h1>How can we help you?</h1>
                <p>
                  Find answers, explore guides and learn how to get the most
                  out of Leo.
                </p>
              </div>
            </div>

            <div className="help-header-badge">
              <MdHeadphones size={17} />
              Help Center
            </div>
          </header>

          <HelpSearch search={search} setSearch={setSearch} />

          <section className="help-browse">
            <div className="help-section-heading">
              <div>
                <h2>Browse by category</h2>
                <p>Find help based on what you want to do.</p>
              </div>
            </div>

            <HelpCategories
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          </section>

          <section className="help-results">
            <div className="help-section-heading">
              <div>
                <h2>
                  {selectedCategory === "All"
                    ? "Popular help articles"
                    : selectedCategory}
                </h2>
                <p>{filteredArticles.length} articles available</p>
              </div>
            </div>

            {filteredArticles.length > 0 ? (
              <div className="help-article-grid">
                {filteredArticles.map(article => (
                  <HelpArticleCard
                    key={article.id}
                    article={article}
                    onClick={() => setSelectedArticle(article)}
                  />
                ))}
              </div>
            ) : (
              <div className="help-empty">
                <MdMenuBook size={35} />
                <h3>No articles found</h3>
                <p>
                  Try another search term or select a different category.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("All");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default HelpCenter;
