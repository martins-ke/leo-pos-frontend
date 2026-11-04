import { Link } from 'react-router-dom';
import {
  MdArrowForward,
  MdArrowOutward,
  MdGroups,
  MdInventory2,
  MdInsights,
  MdPointOfSale,
  MdStorefront,
  MdTaskAlt,
} from 'react-icons/md';
import LeoMark from '../components/branding/LeoMark';
import styles from './LandingPage.module.css';

const capabilities = [
  {
    icon: MdPointOfSale,
    title: 'Sell without the scramble',
    description: 'Ring up orders, record payments and keep checkout moving from one simple point of sale.',
  },
  {
    icon: MdInventory2,
    title: 'Know what is on your shelves',
    description: 'Keep product quantities and stock changes together, so you can act before a gap catches you out.',
  },
  {
    icon: MdInsights,
    title: 'Understand how the day went',
    description: 'Review sales and business activity in one place instead of piecing the story together.',
  },
  {
    icon: MdStorefront,
    title: 'Keep every shop in view',
    description: 'Manage your outlets from one account and see how each part of your business is doing.',
  },
  {
    icon: MdGroups,
    title: 'Bring your team into the flow',
    description: 'Give staff access to the tools they need and keep everyday work organized.',
  },
  {
    icon: MdTaskAlt,
    title: 'Keep customer records close',
    description: 'Find customer details and balances alongside the sales and service they relate to.',
  },
];

const dailySteps = [
  {
    number: '01',
    icon: MdPointOfSale,
    title: 'Make the sale',
    description: 'Record what went out and how it was paid for as you serve each customer.',
    detail: 'CHECK OUT',
  },
  {
    number: '02',
    icon: MdInventory2,
    title: 'Stay ahead of stock',
    description: 'Keep product quantities connected to sales, so you know what needs attention.',
    detail: 'TRACK PRODUCTS',
  },
  {
    number: '03',
    icon: MdInsights,
    title: 'See where you stand',
    description: 'Bring the day’s activity into focus and decide what your shop needs next.',
    detail: 'REVIEW YOUR DAY',
  },
];

function Logo({ compact = false }) {
  return (
    <span className={`${styles.logo} ${compact ? styles.compactLogo : ''}`}>
      <span className={styles.logoIcon}><LeoMark /></span>
      <span>Leo<span className={styles.logoDot}>.</span></span>
    </span>
  );
}

function DashboardPreview() {
  return (
    <div className={styles.dashboardFrame} aria-label="Illustrative shop dashboard">
      <div className={styles.dashboardTopbar}>
        <Logo compact />
        <span className={styles.sampleBadge}>SAMPLE SHOP</span>
      </div>

      <div className={styles.dashboardIntro}>
        <div>
          <span className={styles.dashboardKicker}>SHOP OVERVIEW</span>
          <h2>Today at a glance</h2>
        </div>
        <span className={styles.todayPill}>TODAY</span>
      </div>

      <div className={styles.metricGrid}>
        <article className={styles.metricCard}>
          <span>Sales today</span>
          <strong>KSh 84,500</strong>
          <small>Recorded sales</small>
        </article>
        <article className={styles.metricCard}>
          <span>Transactions</span>
          <strong>156</strong>
          <small>Completed orders</small>
        </article>
        <article className={styles.metricCard}>
          <span>Products</span>
          <strong>248</strong>
          <small>In your catalogue</small>
        </article>
      </div>

      <div className={styles.dashboardDetails}>
        <section className={styles.salesPanel} aria-label="Illustrative weekly sales chart">
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.dashboardKicker}>SALES ACTIVITY</span>
              <h3>A week in view</h3>
            </div>
            <span className={styles.periodLabel}>This week</span>
          </div>
          <div className={styles.chart} aria-hidden="true">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
              <div className={styles.chartColumn} key={`${day}-${index}`}>
                <span className={styles.chartBar} />
                <small>{day}</small>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.activityPanel} aria-label="Illustrative recent activity">
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.dashboardKicker}>RECENT ACTIVITY</span>
              <h3>What’s moving</h3>
            </div>
            <MdArrowOutward aria-hidden="true" />
          </div>
          <div className={styles.activityRow}>
            <span className={styles.activityIcon}><MdPointOfSale aria-hidden="true" /></span>
            <span><strong>Sale recorded</strong><small>Today, 10:42 am</small></span>
            <b>+ KSh 2,400</b>
          </div>
          <div className={styles.activityRow}>
            <span className={`${styles.activityIcon} ${styles.stockIcon}`}><MdInventory2 aria-hidden="true" /></span>
            <span><strong>Stock updated</strong><small>Today, 10:18 am</small></span>
            <b>12 items</b>
          </div>
        </section>
      </div>

      <p className={styles.sampleNote}>Illustrative preview · figures shown are sample data</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Main navigation">
          <Link to="/" className={styles.logoLink} aria-label="Leo home">
            <Logo />
          </Link>

          <div className={styles.navLinks}>
            <a href="#how-it-works">How it works</a>
            <a href="#tools">What you can do</a>
          </div>

          <div className={styles.navActions}>
            <Link to="/login" className={styles.loginBtn}>Log in</Link>
            <Link to="/register" className={styles.navCta}>
              Create your shop <MdArrowOutward aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowMark} />
            FOR THE PEOPLE RUNNING THE SHOP
          </span>
          <h1>Run the shop.<br /><span>Know the numbers.</span></h1>
          <p className={styles.heroDescription}>
            Make sales, keep track of stock and understand how your business is doing—all in one
            straightforward place.
          </p>
          <div className={styles.heroActions}>
            <Link to="/register" className={styles.primaryBtn}>
              Get started with Leo <MdArrowForward aria-hidden="true" />
            </Link>
            <a href="#how-it-works" className={styles.secondaryBtn}>See how it works</a>
          </div>
          <div className={styles.heroNote}>
            <span className={styles.noteIcon} aria-hidden="true"><MdTaskAlt /></span>
            Point of sale, stock and shop activity—working together.
          </div>
        </div>

        <div className={styles.heroVisual}>
          <DashboardPreview />
        </div>
      </section>

      <section className={styles.proofStrip} aria-label="Tools included with Leo">
        <div className={styles.proofInner}>
          <p>THE ESSENTIALS FOR YOUR EVERYDAY</p>
          <div className={styles.proofItems}>
            <span><MdPointOfSale aria-hidden="true" /> Sales</span>
            <span><MdInventory2 aria-hidden="true" /> Stock</span>
            <span><MdInsights aria-hidden="true" /> Business activity</span>
            <span><MdGroups aria-hidden="true" /> Your team</span>
            <span><MdStorefront aria-hidden="true" /> Multiple shops</span>
          </div>
        </div>
      </section>

      <section className={styles.workflow} id="how-it-works">
        <div className={styles.sectionHeading}>
          <span className={styles.sectionLabel}>A BETTER WAY THROUGH THE DAY</span>
          <h2>The work is connected.<br />Your tools should be too.</h2>
          <p>Leo brings the everyday tasks of running a shop into one clear, practical flow.</p>
        </div>

        <div className={styles.workflowGrid}>
          {dailySteps.map(({ number, icon: Icon, title, description, detail }) => (
            <article className={styles.workflowCard} key={number}>
              <div className={styles.workflowCardTop}>
                <span className={styles.stepNumber}>{number}</span>
                <span className={styles.workflowIcon}><Icon aria-hidden="true" /></span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className={styles.workflowDetail}>{detail}<MdArrowForward aria-hidden="true" /></span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.capabilities} id="tools">
        <div className={styles.capabilitiesIntro}>
          <span className={styles.sectionLabel}>BUILT AROUND YOUR SHOP</span>
          <h2>Less switching.<br /><span>More seeing the whole picture.</span></h2>
          <p>
            Sales, stock, customers and your team are part of the same business day. Leo helps you
            keep the details together as your shop grows.
          </p>
          <Link to="/register" className={styles.textLink}>
            Bring your shop into focus <MdArrowForward aria-hidden="true" />
          </Link>
        </div>

        <div className={styles.capabilityGrid}>
          {capabilities.map(({ icon: Icon, title, description }) => (
            <article className={styles.capabilityCard} key={title}>
              <span className={styles.capabilityIcon}><Icon aria-hidden="true" /></span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <span className={styles.ctaEyebrow}>MAKE TODAY A LITTLE CLEARER</span>
          <h2>Ready to get your shop in sync?</h2>
          <p>Bring your day-to-day business into one place with Leo.</p>
          <Link to="/register" className={styles.ctaBtn}>
            Create your shop <MdArrowForward aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.ctaMark} aria-hidden="true"><LeoMark /></div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerMain}>
          <div className={styles.footerBrand}>
            <Link to="/" className={styles.logoLink} aria-label="Leo home"><Logo /></Link>
            <p>Clearer shop days start with the right things in one place.</p>
          </div>

          <div className={styles.footerLinks}>
            <div>
              <h2>Explore</h2>
              <a href="#how-it-works">How it works</a>
              <a href="#tools">What you can do</a>
            </div>
            <div>
              <h2>Your account</h2>
              <Link to="/login">Log in</Link>
              <Link to="/register">Create your shop</Link>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} Leo. All rights reserved.</span>
          <span>Made for the work of today.</span>
        </div>
      </footer>
    </main>
  );
}
