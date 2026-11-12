import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MdArrowForward,
  MdArrowOutward,
  MdPointOfSale,
  MdInventory2,
  MdInsights,
  MdStorefront,
  MdGroups,
  MdAccountBalanceWallet,
  MdCheckCircle,
  MdStar, 
  MdPrint,
  MdQrCodeScanner,
  MdCheck,
} from 'react-icons/md';
import LeoMark from '../components/branding/LeoMark';
import styles from './LandingPage.module.css';

/* ─── Feature Data for Leo POS ─────────────────────────────────── */

const CORE_FEATURES = [
  {
    icon: MdPointOfSale,
    badge: 'Checkout Speed',
    title: 'Lightning-Fast POS Register',
    description:
      'Ring up sales in under 3 seconds. Supports barcode scanning, quick-tap product grid, cash change calculation, and split tender.',
    accent: 'orange',
  },
  {
    icon: MdInventory2,
    badge: 'Stock Sync',
    title: 'Real-Time Inventory Control',
    description:
      'Automatic stock deductions with every sale. Set reorder thresholds and get instant low-stock alerts before your shelves run empty.',
    accent: 'blue',
  },
  {
    icon: MdStorefront,
    badge: 'Multi-Outlet',
    title: 'Central Multi-Shop Control',
    description:
      'Run 1 shop or 10 branches from one central login. Track each store’s revenue, stock levels, and staff performance in real time.',
    accent: 'orange',
  },
  {
    icon: MdGroups,
    badge: 'Loss Prevention',
    title: 'Cashier & Staff Security',
    description:
      'Assign cashiers to specific shops with role-based permissions. Daily shift drawer balancing prevents shrinkage and unauthorized discounts.',
    accent: 'blue',
  },
  {
    icon: MdAccountBalanceWallet,
    badge: 'Madeni Ledger',
    title: 'Customer Credit & Debts',
    description:
      'Keep a digital debt ledger for trusted customers. Track partial settlements, credit limits, and purchase histories with zero paperwork.',
    accent: 'orange',
  },
  {
    icon: MdInsights,
    badge: 'Gross Margin',
    title: 'Live Profit & Expense Tracking',
    description:
      'Deduct shop rent, electricity, and operational costs from your gross sales to view true net profits. Full Jasper PDF export.',
    accent: 'blue',
  },
];

const PRICING_TIERS = [
  {
    name: 'Starter Counter',
    target: 'Single Retail Store',
    price: 'KES 999',
    period: '/ month',
    description: 'Perfect for retail shops, minimarts, boutiques, and single kiosks.',
    features: [
      '1 Shop Outlet',
      'Up to 3 Cashier / Staff Logins',
      'Unlimited Products & Barcodes',
      'High-Speed POS Register',
      'Thermal Receipt Printing (ESC/POS)',
      'Customer Debt (Madeni) Ledger',
      'Daily Sales & Expense Reports',
      'WhatsApp & Email Support',
    ],
    cta: 'Start 14-Day Free Trial',
    popular: false,
  },
  {
    name: 'Business Pro',
    target: 'Multi-Branch Stores',
    price: 'KES 3,500',
    period: '/ month',
    description: 'Engineered for growing retail brands operating across multiple locations.',
    features: [
      'Up to 5 Separate Shop Outlets',
      'Unlimited Cashier & Staff Accounts',
      'Inter-Shop Stock Transfers',
      'Consolidated Owner Executive Dashboard',
      'Role Permissions & Shift Cash Audit',
      'Customer Credit Limits & SMS Reminders',
      'Jasper PDF Statements & Tax Summaries',
      'Priority 24/7 Dedicated Support',
    ],
    cta: 'Start 14-Day Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise Chain',
    target: 'Supermarkets & Franchises',
    price: 'KES 8,500',
    period: '/ month',
    description: 'Custom configurations for large retail networks, supermarkets & wholesalers.',
    features: [
      'Unlimited Outlets & Warehouses',
      'Custom ERP & Barcode Scanner Integration',
      'Multi-Till Cashier Reconciliation',
      'Automated Multi-Tenant Cloud Backups',
      'Custom Business Logic & PDF Receipt Design',
      'On-Site Staff Training & Hardware Setup',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const QUICK_STATS = [
  { val: '< 2.5s', label: 'Average checkout time' },
  { val: '100%', label: 'Cryptographic tenant isolation' },
  { val: '24/7', label: 'Offline-ready counter sync' },
  { val: 'KES 0', label: 'Setup fee / cancel anytime' },
];

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('register');

  return (
    <div className={styles.pageWrapper}>
      {/* ── Glowing Ambient Orbs (Orange & Light-Blue) ── */}
      <div className={styles.glowOrbOrange} aria-hidden="true" />
      <div className={styles.glowOrbBlue} aria-hidden="true" />
      <div className={styles.glowOrbSecondary} aria-hidden="true" />

      {/* ── Clean Pro Navbar (Free trial button removed from header) ── */}
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link to="/" className={styles.logoLink} aria-label="Leo POS Home">
            <div className={styles.logoMarkWrapper}>
              <LeoMark />
            </div>
            <div className={styles.brandTitleText}>
              <span className={styles.brandName}>Leo</span>
              <span className={styles.brandMeaningBadge}>Today's shop manager</span>
            </div>
          </Link>

          <div className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="#terminal">POS Register</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
          </div>

          <div className={styles.navActions}>
            <Link to="/login" className={styles.loginBtn}>
              <span> Login</span>
              <MdArrowOutward />
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero Section ── */}
      <section className={styles.heroSection}>
        <div className={styles.heroContainer}>
          <div className={styles.heroBadgeBox}>
            <span className={styles.heroBadgePill}>
              <span className={styles.badgeDotLive} />
              THE REAL-TIME POS FOR Wholesale/Retail SHOPS
            </span>
          </div>

          <h1 className={styles.heroHeadline}>
            Run Your Entire Shop.<br />
            <span className={styles.glowTextOrange}>Keep Track of Everything</span>{' '}
            <span className={styles.glowTextBlue}>Cloud-Powered.</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Leo gives business owners real-time control of today's sales. Lightning-fast checkout,
            multi-outlet inventory tracking, cashier anti-theft controls, and customer debt ledger.
          </p>

          <div className={styles.heroCtaGroup}>
            <Link to="/register" className={styles.heroCtaOrange}>
              <span>Start 14-Day Free Trial</span>
              <MdArrowForward />
            </Link>
            <Link to="/login" className={styles.heroCtaGlass}>
              <MdPointOfSale />
              <span>Launch POS Demo</span>
            </Link>
          </div>

          <div className={styles.heroTrustTicks}>
            <span><MdCheck /> No Credit Card Required</span>
            <span><MdCheck /> Works on Phones, Tabs & PCs</span>
            <span><MdCheck /> Instant Setup in 2 Mins</span>
          </div>

          {/* ── Mockup: Interactive Glowing POS Terminal Screen ── */}
          <div className={styles.terminalContainer} id="terminal">
            <div className={styles.terminalWindow}>
              {/* Chrome Top Bar */}
              <div className={styles.terminalTopBar}>
                <div className={styles.terminalDots}>
                  <span className={styles.tDotRed} />
                  <span className={styles.tDotYellow} />
                  <span className={styles.tDotGreen} />
                </div>
                <div className={styles.terminalSearchSim}>
                  <MdPointOfSale /> <span>Main Street Outlet · Cashier: Jane M.</span>
                </div>
                <div className={styles.terminalStatusPill}>
                  <span className={styles.greenPulse} /> <span>Live Synced</span>
                </div>
              </div>

              {/* Terminal Workspace Mock */}
              <div className={styles.terminalBody}>
                {/* Left Side: Category & Product Selection */}
                <div className={styles.posRegisterLeft}>
                  <div className={styles.posTabRow}>
                    <button
                      type="button"
                      className={`${styles.posTab} ${activeTab === 'register' ? styles.posTabActive : ''}`}
                      onClick={() => setActiveTab('register')}
                    >
                      <MdQrCodeScanner /> Quick Register
                    </button>
                    <button
                      type="button"
                      className={`${styles.posTab} ${activeTab === 'stock' ? styles.posTabActive : ''}`}
                      onClick={() => setActiveTab('stock')}
                    >
                      <MdInventory2 /> Stock (248)
                    </button>
                    <button
                      type="button"
                      className={`${styles.posTab} ${activeTab === 'madeni' ? styles.posTabActive : ''}`}
                      onClick={() => setActiveTab('madeni')}
                    >
                      <MdAccountBalanceWallet /> Debts
                    </button>
                  </div>

                  <div className={styles.productGridMock}>
                    <div className={styles.posItemCard}>
                      <span className={styles.itemCategory}>Groceries</span>
                      <strong>Jogoo Maize 2kg</strong>
                      <div className={styles.itemBottomRow}>
                        <b>KSh 210</b>
                        <span className={styles.stockBadge}>42 left</span>
                      </div>
                    </div>

                    <div className={styles.posItemCard}>
                      <span className={styles.itemCategory}>Dairy</span>
                      <strong>Fresh Milk 500ml</strong>
                      <div className={styles.itemBottomRow}>
                        <b>KSh 65</b>
                        <span className={styles.stockBadge}>28 left</span>
                      </div>
                    </div>

                    <div className={`${styles.posItemCard} ${styles.posItemActive}`}>
                      <span className={styles.itemCategory}>Household</span>
                      <strong>Cooking Oil 2L</strong>
                      <div className={styles.itemBottomRow}>
                        <b>KSh 580</b>
                        <span className={styles.stockBadge}>15 left</span>
                      </div>
                    </div>

                    <div className={styles.posItemCard}>
                      <span className={styles.itemCategory}>Snacks</span>
                      <strong>Wheat Bread 400g</strong>
                      <div className={styles.itemBottomRow}>
                        <b>KSh 60</b>
                        <span className={styles.stockBadge}>19 left</span>
                      </div>
                    </div>

                    <div className={styles.posItemCard}>
                      <span className={styles.itemCategory}>Beverage</span>
                      <strong>Mineral Water 1L</strong>
                      <div className={styles.itemBottomRow}>
                        <b>KSh 50</b>
                        <span className={styles.stockBadge}>84 left</span>
                      </div>
                    </div>

                    <div className={styles.posItemCard}>
                      <span className={styles.itemCategory}>Hygiene</span>
                      <strong>Bar Soap 800g</strong>
                      <div className={styles.itemBottomRow}>
                        <b>KSh 175</b>
                        <span className={styles.stockBadge}>36 left</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Active Cart & Total */}
                <div className={styles.posReceiptRight}>
                  <div className={styles.cartHeader}>
                    <h4>Current Order #4829</h4>
                    <span className={styles.cartCustomerBadge}>Walk-in Customer</span>
                  </div>

                  <div className={styles.cartItemsList}>
                    <div className={styles.cartItemRow}>
                      <div>
                        <strong>Cooking Oil 2L</strong>
                        <small>KSh 580 × 1</small>
                      </div>
                      <b>KSh 580</b>
                    </div>
                    <div className={styles.cartItemRow}>
                      <div>
                        <strong>Jogoo Maize 2kg</strong>
                        <small>KSh 210 × 2</small>
                      </div>
                      <b>KSh 420</b>
                    </div>
                    <div className={styles.cartItemRow}>
                      <div>
                        <strong>Fresh Milk 500ml</strong>
                        <small>KSh 65 × 3</small>
                      </div>
                      <b>KSh 195</b>
                    </div>
                  </div>

                  <div className={styles.cartCalculation}>
                    <div className={styles.calcRow}>
                      <span>Subtotal</span>
                      <span>KSh 1,195</span>
                    </div>
                    <div className={styles.calcRow}>
                      <span>VAT (16%)</span>
                      <span>Included</span>
                    </div>
                    <div className={`${styles.calcRow} ${styles.calcTotal}`}>
                      <span>Total Due</span>
                      <strong>KSh 1,195</strong>
                    </div>
                  </div>

                  <div className={styles.payMethodsGrid}>
                    <button type="button" className={styles.payBtnMpesa}>
                      M-Pesa
                    </button>
                    <button type="button" className={styles.payBtnCash}>
                      Cash
                    </button>
                    <button type="button" className={styles.payBtnCredit}>
                      Debt
                    </button>
                  </div>

                  <button type="button" className={styles.completeOrderBtn}>
                    <MdPrint /> Complete &amp; Print Receipt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section className={styles.statsSection}>
        <div className={styles.statsInner}>
          {QUICK_STATS.map(({ val, label }) => (
            <div key={label} className={styles.statBox}>
              <strong className={styles.statVal}>{val}</strong>
              <span className={styles.statLabel}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid (Pro Orange & Blue Accents) ── */}
      <section className={styles.featuresSection} id="features">
        <div className={styles.sectionHeadCentered}>
          <span className={styles.sectionPreTitle}>ENTERPRISE-GRADE CAPABILITIES</span>
          <h2 className={styles.sectionTitle}>
            Everything You Need to <span className={styles.textGlowOrange}>Master Your Shop</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Built specifically to solve the headaches of shrinkage, slow counter lines, stockouts,
            and unrecorded credit in business.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {CORE_FEATURES.map((feat) => {
            const Icon = feat.icon;
            const isBlue = feat.accent === 'blue';
            return (
              <div
                key={feat.title}
                className={`${styles.featureCard} ${isBlue ? styles.cardBlueBorder : styles.cardOrangeBorder}`}
              >
                <div className={styles.featureTopRow}>
                  <div className={`${styles.featureIconBox} ${isBlue ? styles.iconBlueGlow : styles.iconOrangeGlow}`}>
                    <Icon />
                  </div>
                  <span className={`${styles.featureBadge} ${isBlue ? styles.badgeBlue : styles.badgeOrange}`}>
                    {feat.badge}
                  </span>
                </div>
                <h3 className={styles.featureTitle}>{feat.title}</h3>
                <p className={styles.featureDesc}>{feat.description}</p>
                <div className={styles.featureBottomTick}>
                  <MdCheckCircle className={isBlue ? styles.tickBlue : styles.tickOrange} />
                  <span>Instant real-time sync</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3-Step Setup Section ── */}
      <section className={styles.stepsSection} id="how-it-works">
        <div className={styles.stepsContainer}>
          <div className={styles.sectionHeadCentered}>
            <span className={styles.sectionPreTitle}>READY IN UNDER 3 MINUTES</span>
            <h2 className={styles.sectionTitle}>How to Start Selling with Leo</h2>
            <p className={styles.sectionSubtitle}>
              No hardware locked contracts. Log in from any Android, iPhone, iPad, or PC counter.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumBadge}>01</div>
              <h3>Register Your Shop</h3>
              <p>
                Create your owner profile. Your first shop outlet is auto-configured and secured with JWT encryption.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumBadge}>02</div>
              <h3>Add Products &amp; Prices</h3>
              <p>
                Enter items and barcode numbers or add bulk items. Set selling prices, buying prices, and low-stock alerts.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumBadge}>03</div>
              <h3>Open the Counter &amp; Sell</h3>
              <p>
                Assign your cashiers, ring up orders, take cash or M-Pesa, and monitor gross margins from your phone anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ── */}
      <section className={styles.pricingSection} id="pricing">
        <div className={styles.sectionHeadCentered}>
          <span className={styles.sectionPreTitle}>TRANSPARENT SUBSCRIPTIONS</span>
          <h2 className={styles.sectionTitle}>
            Predictable Pricing for <span className={styles.textGlowOrange}>Ambitious business owners</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            All plans include a full 14-day free trial. Scale as your shop network grows.
          </p>
        </div>

        <div className={styles.pricingGrid}>
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`${styles.pricingCard} ${tier.popular ? styles.popularPricingCard : ''}`}
            >
              {tier.popular && (
                <div className={styles.popularRibbon}>
                  <MdStar /> MOST POPULAR FOR SMES
                </div>
              )}

              <div className={styles.tierHeader}>
                <span className={styles.tierTarget}>{tier.target}</span>
                <h3 className={styles.tierName}>{tier.name}</h3>
                <p className={styles.tierDesc}>{tier.description}</p>
              </div>

              <div className={styles.tierPriceBox}>
                <strong className={styles.priceNum}>{tier.price}</strong>
                <span className={styles.pricePeriod}>{tier.period}</span>
              </div>

              <ul className={styles.tierFeatureList}>
                {tier.features.map((feat) => (
                  <li key={feat}>
                    <MdCheckCircle className={tier.popular ? styles.checkOrange : styles.checkMuted} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={tier.popular ? styles.btnPricingPopular : styles.btnPricingStandard}
              >
                {tier.cta} <MdArrowForward />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Glowing Call to Action Banner ── */}
      <section className={styles.ctaBannerSection}>
        <div className={styles.ctaBannerInner}>
          <div className={styles.ctaBannerContent}>
            <span className={styles.ctaOverline}>TAKE FULL CONTROL TODAY</span>
            <h2>Stop Stock Shrinkage &amp; Disorganized Counters.</h2>
            <p>
              Join hundreds of Kenyan retailers using Leo POS to streamline cashier workflows,
              balance registers, and watch their profits grow.
            </p>
            <div className={styles.ctaButtonRow}>
              <Link to="/register" className={styles.ctaBannerPrimary}>
                <span>Get Started Free for 14 Days</span>
                <MdArrowForward />
              </Link>
              <Link to="/login" className={styles.ctaBannerSecondary}>
                Sign In to Existing Account
              </Link>
            </div>
          </div>
          <div className={styles.ctaMarkGlow} aria-hidden="true">
            <LeoMark />
          </div>
        </div>
      </section>

      {/* ── Modern Pro Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrandCol}>
            <Link to="/" className={styles.footerLogoLink}>
              <div className={styles.footerMark}>
                <LeoMark />
              </div>
              <span className={styles.footerTitle}>Leo POS</span>
            </Link>
            <p className={styles.footerBio}>
              Leo (meaning "Today" in Swahili) is the cloud-native point of sale designed for real-time visibility, speed, and multi-outlet control.
            </p>
            <div className={styles.footerPills}>
              <span className={styles.pillIso}>JWT Isolated</span>
              <span className={styles.pillKe}>Kenya 🇰🇪 · KES</span>
            </div>
          </div>

          <div className={styles.footerCol}>
            <h5>POS Features</h5>
            <ul>
              <li><a href="#terminal">Fast Register</a></li>
              <li><a href="#features">Multi-Branch Sync</a></li>
              <li><a href="#features">Debt Ledger (Madeni)</a></li>
              <li><a href="#features">Staff &amp; Cashier Audits</a></li>
              <li><a href="#features">Jasper PDF Receipts</a></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h5>Account &amp; Access</h5>
            <ul>
              <li><Link to="/login">Cashier / Staff Login</Link></li>
              <li><Link to="/login">Shop Owner Sign In</Link></li>
              <li><Link to="/register">Create New Store</Link></li>
              <li><a href="#pricing">Subscription Tiers</a></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h5>Security &amp; Hardware</h5>
            <ul>
              <li><span>ESC/POS Thermal Printers</span></li>
              <li><span>Barcode &amp; QR Scanners</span></li>
              <li><span>Cash Drawers &amp; Tills</span></li>
              <li><span>Zero-Downtime Offline Buffer</span></li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottomBar}>
          <div className={styles.footerBottomInner}>
            <p>© {new Date().getFullYear()} Leo POS Technologies. All rights reserved.</p>
            <div className={styles.bottomStatus}>
              <span className={styles.statusDot} /> All Systems Operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
