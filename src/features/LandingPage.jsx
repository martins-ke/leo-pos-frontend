import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';

const features = [
  {
    icon: '▦',
    title: 'Smart Inventory',
    description: 'Track products, monitor stock levels and stay informed about your inventory in real time.',
  },
  {
    icon: '↗',
    title: 'Sales Management',
    description: 'Process transactions, track sales and understand your business performance.',
  },
  {
    icon: '◉',
    title: 'Multi-Shop Management',
    description: 'Manage multiple business locations from one centralized platform.',
  },
  {
    icon: '▤',
    title: 'Business Reports',
    description: 'Get meaningful insights into revenue, expenses, profits and business growth.',
  },
  {
    icon: '♙',
    title: 'Staff Management',
    description: 'Manage employees, assign responsibilities and control access to your business.',
  },
  {
    icon: '⌁',
    title: 'Customer Management',
    description: 'Maintain customer records, monitor debts and build stronger customer relationships.',
  },
];

function Logo() {
  return (
    <div className={styles.logo}>
      <div className={styles.logoIcon}>
        <svg viewBox="0 0 40 40" fill="none">
          {/* Calendar frame */}
          <rect
            x="5"
            y="9"
            width="30"
            height="26"
            rx="6"
            stroke="currentColor"
            strokeWidth="2.5"
          />

          {/* Calendar header */}
          <path
            d="M5 16H35"
            stroke="currentColor"
            strokeWidth="2.5"
          />

          {/* Calendar rings */}
          <path
            d="M13 5V12M27 5V12"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Sunrise */}
          <path
            d="M13 27C13 23.1 16.1 20 20 20C23.9 20 27 23.1 27 27"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Horizon */}
          <path
            d="M11 28H29"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <span>
        Leo<span className={styles.logoDot}>.</span>
      </span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className={styles.page}>

      {/* NAVIGATION */}
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link to="/" className={styles.logoLink}>
            <Logo />
          </Link>

          <div className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="#about">Why Leo</a>
            <a href="#contact">Contact</a>
          </div>

          <div className={styles.navActions}>
            <Link to="/login" className={styles.loginBtn}>
              Login
            </Link>
            <Link to="/register" className={styles.navCta}>
              Get Started <span>→</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span className={styles.badgeDot}></span>
            SMARTER BUSINESS MANAGEMENT
          </div>

          <h1>
            Run your business.
            <br />
            <span>Grow without limits.</span>
          </h1>

          <p className={styles.heroDescription}>
            Meet Leo, your all-in-one business management platform.
            Manage sales, inventory, staff and multiple shops from
            one powerful dashboard.
          </p>

          <div className={styles.heroActions}>
            <Link to="/register" className={styles.primaryBtn}>
              Get Started Free <span>→</span>
            </Link>
            <a href="#features" className={styles.secondaryBtn}>
              Explore Features
            </a>
          </div>

          <div className={styles.heroTrust}>
            <div className={styles.trustIcon}>✓</div>
            <span>Everything your business needs, in one place.</span>
          </div>
        </div>

        {/* DASHBOARD PREVIEW */}
        <div className={styles.heroVisual}>
          <div className={styles.glow}></div>

          <div className={styles.dashboardPreview}>
            <div className={styles.previewHeader}>
              <Logo />
              <span className={styles.liveBadge}>
                <span></span> LIVE OVERVIEW
              </span>
            </div>

            <div className={styles.previewWelcome}>
              <div>
                <small>BUSINESS OVERVIEW</small>
                <h3>Your business at a glance.</h3>
              </div>
              <div className={styles.previewAvatar}>JD</div>
            </div>

            <div className={styles.previewStats}>
              <div className={styles.statCard}>
                <span>Total Sales</span>
                <h3>KSh 84,500</h3>
                <small className={styles.positive}>↑ Business revenue</small>
              </div>

              <div className={styles.statCard}>
                <span>Products</span>
                <h3>248</h3>
                <small>Inventory items</small>
              </div>

              <div className={styles.statCard}>
                <span>Transactions</span>
                <h3>156</h3>
                <small>Sales recorded</small>
              </div>
            </div>

            <div className={styles.chartCard}>
              <div className={styles.chartHeading}>
                <div>
                  <small>SALES PERFORMANCE</small>
                  <h3>Revenue overview</h3>
                </div>
                <span>This week⌄</span>
              </div>

              <div className={styles.chart}>
                {[35, 55, 42, 75, 58, 90, 68, 100, 78, 88, 65, 95].map(
                  (height, index) => (
                    <div className={styles.chartColumn} key={index}>
                      <div style={{ height: `${height}%` }}></div>
                    </div>
                  )
                )}
              </div>

              <div className={styles.chartLabels}>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>

            <div className={styles.previewBottom}>
              <div className={styles.bottomIcon}>✓</div>
              <div>
                <strong>Your business, under control.</strong>
                <small>All your operations in one place.</small>
              </div>
            </div>
          </div>

          <div className={styles.floatingCard}>
            <div className={styles.floatingIcon}>↗</div>
            <div>
              <strong>Real-time insights</strong>
              <small>Know your numbers.</small>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className={styles.trustStrip}>
        <p>ONE PLATFORM. COMPLETE BUSINESS CONTROL.</p>
        <div className={styles.trustItems}>
          <span>✦ Sales</span>
          <span>✦ Inventory</span>
          <span>✦ Employees</span>
          <span>✦ Analytics</span>
          <span>✦ Multiple Shops</span>
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.features} id="features">
        <div className={styles.sectionHeading}>
          <span className={styles.sectionLabel}>POWERFUL FEATURES</span>
          <h2>Everything you need to<br />run a smarter business.</h2>
          <p>
            Stop juggling different tools. Leo brings your essential
            business operations together in one place.
          </p>
        </div>

        <div className={styles.featureGrid}>
          {features.map((feature, index) => (
            <div className={styles.featureCard} key={feature.title}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className={styles.featureNumber}>
                0{index + 1}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT / VALUE */}
      <section className={styles.about} id="about">
        <div className={styles.aboutContent}>
          <span className={styles.sectionLabel}>BUSINESS WITHOUT COMPLEXITY</span>
          <h2>
            Less time managing.
            <br />
            <span>More time growing.</span>
          </h2>
          <p>
            Whether you operate one shop or multiple branches,
            Leo gives you the visibility and tools to make better
            business decisions.
          </p>

          <div className={styles.aboutPoints}>
            <div><span>✓</span> Centralized business management</div>
            <div><span>✓</span> Monitor multiple shop locations</div>
            <div><span>✓</span> Make informed business decisions</div>
          </div>

          <Link to="/register" className={styles.primaryBtn}>
            Start Managing Smarter →
          </Link>
        </div>

        <div className={styles.aboutVisual}>
          <div className={styles.aboutCircle}></div>
          <div className={styles.aboutCard}>
            <Logo />
            <div className={styles.aboutCardIcon}>⌁</div>
            <h3>One platform.</h3>
            <h3 className={styles.greenText}>Every operation.</h3>
            <p>Your entire business ecosystem, connected.</p>
            <div className={styles.aboutCardLine}></div>
            <div className={styles.aboutCardFooter}>
              <span>SALES</span>
              <span>STOCK</span>
              <span>GROWTH</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta} id="contact">
        <div className={styles.ctaContent}>
          <span>YOUR BUSINESS DESERVES BETTER</span>
          <h2>Ready to take control<br />of your business?</h2>
          <p>
            Start managing your business smarter with Leo.
          </p>
          <Link to="/register" className={styles.ctaBtn}>
            Get Started Today <span>→</span>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerMain}>
          <div className={styles.footerBrand}>
            <Logo />
            <p>
              Smarter business management.
              One powerful platform.
            </p>
          </div>

          <div className={styles.footerLinks}>
            <div>
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#about">Why Leo</a>
              <Link to="/register">Get Started</Link>
            </div>

            <div>
              <h4>Account</h4>
              <Link to="/login">Login</Link>
              <Link to="/register">Create Account</Link>
            </div>

            <div>
              <h4>Explore</h4>
              <a href="#contact">Contact</a>
              <a href="#features">Our Platform</a>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} Brian omusugu. All rights reserved.</span>
          <span>Built for businesses that want to grow.</span>
        </div>
      </footer>

    </main>
  );
}