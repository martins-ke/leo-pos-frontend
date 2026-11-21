
const helpArticles = [
  {
    id: 1,
    category: "Getting Started",
    icon: "🚀",
    title: "Getting started with Leo",
    description: "Learn the basics of setting up and using Leo POS.",
    content: [
      {
        heading: "Logging into Leo",
        steps: [
          "Open your Leo POS application and click login button or Launch POS button.",
          "Enter your registered email/username and password.",
          "Click Login to access your account."
        ]
      },
      {
        heading: "Setting up your shop",
        steps: [
          "Navigate to the Shops section.",
          "Click Add Shop.",
          "Enter your shop information.",
          "Save your shop details."
        ]
      }
    ]
  },
  {
    id: 2,
    category: "Products & Inventory",
    icon: "📦",
    title: "Adding a new product",
    description: "Learn how to add products to your inventory.",
    content: [
      {
        heading: "Adding a product",
        steps: [
          "Navigate to Products.",
          "Click Add Product.",
          "Enter the product name.",
          "Enter the buying price.",
          "Enter the selling price.",
          "Enter the available quantity.",
          "Save the product."
        ]
      }
    ]
  },
  {
    id: 3,
    category: "Products & Inventory",
    icon: "📊",
    title: "Managing stock",
    description: "Understand how to monitor and update your inventory.",
    content: [
      {
        heading: "Checking stock",
        steps: [
          "Open the Products section.",
          "Find the product you want to check.",
          "Review its available stock quantity."
        ]
      },
      {
        heading: "Updating stock",
        steps: [
          "Select the relevant product.",
          "Choose the stock update option available in your application.",
          "Enter the updated quantity.",
          "Save your changes."
        ]
      }
    ]
  },
  {
    id: 4,
    category: "Sales",
    icon: "🛒",
    title: "Recording a sale",
    description: "Learn how to process customer purchases.",
    content: [
      {
        heading: "Making a sale",
        steps: [
          "Open the POS section.",
          "Select the products purchased.",
          "Enter the quantities.",
          "Review the total amount.",
          "Select the payment method.",
          "Confirm the sale."
        ]
      }
    ]
  },
  {
    id: 5,
    category: "Customers & Debts",
    icon: "👤",
    title: "Registering a customer",
    description: "Learn how to add and manage customers.",
    content: [
      {
        heading: "Adding a customer",
        steps: [
          "Navigate to Customers.",
          "Click Add Customer.",
          "Enter the customer's details.",
          "Save the customer."
        ]
      }
    ]
  },
  {
    id: 6,
    category: "Customers & Debts",
    icon: "💳",
    title: "Managing customer debts",
    description: "Learn how to track outstanding customer balances.",
    content: [
      {
        heading: "Viewing debts",
        steps: [
          "Navigate to Debts.",
          "Find the customer whose balance you want to review.",
          "Check the outstanding amount."
        ]
      }
    ]
  },
  {
    id: 7,
    category: "Expenses",
    icon: "💰",
    title: "Recording shop expenses",
    description: "Learn how to record and monitor business expenses.",
    content: [
      {
        heading: "Adding an expense",
        steps: [
          "Navigate to Expenses.",
          "Click Add Expense.",
          "Enter the expense details.",
          "Enter the amount.",
          "Save the expense."
        ]
      }
    ]
  },
  {
    id: 8,
    category: "Staff Management",
    icon: "👥",
    title: "Adding a cashier",
    description: "Learn how to add employees to your shop.",
    content: [
      {
        heading: "Adding staff",
        steps: [
          "Navigate to Staff.",
          "Click Add Staff.",
          "Enter the employee details.",
          "Assign the appropriate role.",
          "Save the employee."
        ]
      }
    ]
  },
  {
    id: 9,
    category: "Reports & Dashboard",
    icon: "📈",
    title: "Understanding your dashboard",
    description: "Learn how to monitor shop performance.",
    content: [
      {
        heading: "Using the dashboard",
        steps: [
          "Open the Dashboard.",
          "Review the sales summary.",
          "Review expenses.",
          "Check your business performance."
        ]
      }
    ]
  },
  {
    id: 10,
    category: "Troubleshooting",
    icon: "🔧",
    title: "Unable to log in",
    description: "What to do when you cannot access your account.",
    content: [
      {
        heading: "Troubleshooting login problems",
        steps: [
          "Check your internet connection.",
          "Confirm that your email address is correct.",
          "Check your password.",
          "Try logging in again."
        ]
      }
    ]
  }
];

export default helpArticles;
