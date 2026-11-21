
import { MdArrowBack, MdMenuBook } from "react-icons/md";

function HelpArticleView({ article, onBack }) {
  return (
    <div className="help-article-view">

      <button
        type="button"
        className="help-back-btn"
        onClick={onBack}
      >
        <MdArrowBack size={17} />
        Back to Help Center
      </button>

      <div className="help-article-heading">
        <div className="help-article-heading-icon">
          {article.icon}
        </div>

        <div>
          <span className="help-article-category">
            {article.category}
          </span>

          <h1>{article.title}</h1>

          <p>{article.description}</p>
        </div>
      </div>

      <div className="help-article-body">
        {article.content.map((section, index) => (
          <section
            key={index}
            className="help-content-section"
          >
            <h2>
              <MdMenuBook size={19} />
              {section.heading}
            </h2>

            <ol>
              {section.steps.map((step, stepIndex) => (
                <li key={stepIndex}>
                  <span className="help-step-number">
                    {stepIndex + 1}
                  </span>

                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

    </div>
  );
}

export default HelpArticleView;
