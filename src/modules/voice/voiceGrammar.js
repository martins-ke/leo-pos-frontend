
// Voice Grammar & Natural Language Intent Parser for POS
// Improved replacement for the original module.
// No additional dependencies required.

const NUMBER_WORDS = {     
  zero: 0,
  one: 1,
  won: 1,
  two: 2,
  to: 2,
  too: 2,
  three: 3,
  tree: 3,
  four: 4,
  for: 4,
  fore: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  ate: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000,
  half: 0.5,
  quarter: 0.25,
};

const ORDINAL_WORDS = {
  first: 1,
  "1st": 1,
  second: 2,
  "2nd": 2,
  third: 3,
  "3rd": 3,
  fourth: 4,
  "4th": 4,
  fifth: 5,
  "5th": 5,
  sixth: 6,
  "6th": 6,
  seventh: 7,
  "7th": 7,
  eighth: 8,
  "8th": 8,
  ninth: 9,
  "9th": 9,
  tenth: 10,
  "10th": 10,
};

const MAX_TRANSCRIPT_LENGTH = 500;
const MAX_QUANTITY = 1000000;
const MAX_AMOUNT = 1000000000;

function isValidNumber(value, maximum = MAX_AMOUNT) {
  const number = Number(value);

  return (
    Number.isFinite(number) &&
    number >= 0 &&
    number <= maximum
  );
}

function parseNumber(value, maximum = MAX_AMOUNT) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (!isValidNumber(value, maximum)) {
    return null;
  }

  return Number(value);
}

function isValidQuery(query) {
  return Boolean(
    query &&
    query.trim() &&
    !/^(cart|items|total|help|menu)$/i.test(query.trim())
  );
}

/**
 * Convert spoken number phrases into digits.
 *
 * Examples:
 * "add two milk" -> "add 2 milk"
 * "five hundred sugar" -> "500 sugar"
 * "twenty five eggs" -> "25 eggs"
 * "one thousand five hundred" -> "1500"
 *
 * Avoids converting isolated words such as "for" in ordinary
 * sentences unless they form part of a recognized number phrase.
 */
export function normalizeSpokenNumbers(text) {
  if (typeof text !== "string" || !text.trim()) {
    return "";
  }

  const tokens = text.toLowerCase().match(
    /\d+(?:\.\d+)?|[a-z]+|[^\s]/g
  ) || [];

  const output = [];
  let i = 0;

  function parseNumber(start) {
    let index = start;
    let total = 0;
    let current = 0;
    let consumed = false;
    let lastNumber = false;

    while (index < tokens.length) {
      const token = tokens[index];

      // Existing numeric values remain unchanged.
      if (/^\d+(?:\.\d+)?$/.test(token)) {
        if (consumed) break;

        return {
          value: token,
          next: index + 1,
        };
      }

      if (!Object.prototype.hasOwnProperty.call(NUMBER_WORDS, token)) {
        break;
      }

      // Handle hundred and thousand multipliers.
      if (token === "hundred") {
        if (!consumed || current === 0) break;

        current *= 100;
      } else if (token === "thousand") {
        if (!consumed || current === 0) break;

        total += current * 1000;
        current = 0;
      } else {
        const value = NUMBER_WORDS[token];

        if (value === 0.5 || value === 0.25) {
          if (consumed) break;

          current = value;
        } else if (value >= 20 && value < 100) {
          if (current !== 0) break;

          current = value;
        } else if (value >= 10 && value < 20) {
          if (current !== 0) break;

          current = value;
        } else if (value >= 0 && value < 10) {
          if (current !== 0) break;

          current = value;
        } else {
          break;
        }
      }

      consumed = true;
      lastNumber = true;
      index++;

      // Allow "one hundred and twenty".
      if (
        tokens[index] === "and" &&
        Object.prototype.hasOwnProperty.call(
          NUMBER_WORDS,
          tokens[index + 1]
        )
      ) {
        index++;
        lastNumber = false;
        continue;
      }

      // Allow compound tens: "twenty five".
      if (
        current >= 20 &&
        current < 100 &&
        tokens[index] &&
        NUMBER_WORDS[tokens[index]] >= 1 &&
        NUMBER_WORDS[tokens[index]] <= 9
      ) {
        current += NUMBER_WORDS[tokens[index]];
        index++;
      }

      if (
        tokens[index] === "hundred" ||
        tokens[index] === "thousand"
      ) {
        lastNumber = false;
        continue;
      }

      break;
    }

    if (!consumed || !lastNumber) return null;

    return {
      value: String(total + current),
      next: index,
    };
  }

  while (i < tokens.length) {
    const parsed = parseNumber(i);

    if (parsed) {
      output.push(parsed.value);
      i = parsed.next;
    } else {
      output.push(tokens[i]);
      i++;
    }
  }

  return output.join(" ").replace(/\s+([.,?!])/g, "$1");
}

/**
 * Remove common conversational prefixes.
 */
export function stripConversationalPrefixes(text) {
  if (typeof text !== "string" || !text.trim()) {
    return "";
  }

  let result = text.trim();

  const prefixes = [
    /^(?:hey\s+)?can you (?:please )?/i,
    /^could you (?:please )?/i,
    /^would you (?:please )?/i,
    /^please\s+/i,
    /^kindly\s+/i,
    /^help me\s+/i,
    /^i want you to\s+/i,
    /^i want to\s+/i,
    /^i would like to\s+/i,
    /^i need you to\s+/i,
    /^i need to\s+/i,
    /^we need to\s+/i,
    /^we want to\s+/i,
    /^go ahead and\s+/i,
    /^let us\s+/i,
    /^let's\s+/i,
  ];

  for (let count = 0; count < 3; count++) {
    const previous = result;

    for (const prefix of prefixes) {
      result = result.replace(prefix, "");
    }

    if (previous === result) break;
  }

  return result.trim();
}

/**
 * Parse a choice from a disambiguation list.
 */
export function parseSelectionChoice(rawText, maxOptions = 10) {
  if (typeof rawText !== "string") return null;

  const clean = normalizeSpokenNumbers(rawText)
    .toLowerCase()
    .replace(/^(option|choice|number|item)\s+/i, "")
    .trim();

  if (/^\d+$/.test(clean)) {
    const number = Number(clean);

    return number >= 1 && number <= maxOptions
      ? number
      : null;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      ORDINAL_WORDS,
      clean
    )
  ) {
    const number = ORDINAL_WORDS[clean];

    return number <= maxOptions ? number : null;
  }

  const number = NUMBER_WORDS[clean];

  if (
    Number.isInteger(number) &&
    number >= 1 &&
    number <= maxOptions
  ) {
    return number;
  }

  return null;
}

/**
 * Normalize business-related speech.
 */
export function normalizeBusinessSpeech(rawTranscript) {
  if (
    typeof rawTranscript !== "string" ||
    !rawTranscript.trim()
  ) {
    return "";
  }

  let text = rawTranscript
    .slice(0, MAX_TRANSCRIPT_LENGTH)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[.,?!]+$/g, "")
    .trim();

  // Common speech recognition and Kenyan business variations.
  text = text
    .replace(/\bcells?\b/g, "sales")
    .replace(/\bsells?\b/g, "sales")
    .replace(/\bm[\s-]?pesa\b/g, "mpesa")
    .replace(/\bkenyan shillings?\b/g, "kes")
    .replace(/\bshillings?\b/g, "kes");

  text = normalizeSpokenNumbers(text);

  // Common ways users ask about business performance.
  text = text
    .replace(/\bwhat are our sales\b/g, "sales")
    .replace(/\bshow me (?:the )?sales\b/g, "sales")
    .replace(/\bwhat are today's sales\b/g, "sales today")
    .replace(/\bhow much did we sell today\b/g, "sales today")
    .replace(/\bhow much have we sold today\b/g, "sales today")
    .replace(/\bhow much did we make today\b/g, "sales today")
    .replace(/\bhow much money did we make today\b/g, "sales today")
    .replace(/\bcompare sales for today and yesterday\b/g, "compare sales yesterday and today")
    .replace(/\bcompare today's sales with yesterday\b/g, "compare sales yesterday and today")
    .replace(/\bwhat is today's revenue\b/g, "revenue today");

  return text.replace(/\s+/g, " ").trim();
}

/**
 * Parse a transcript into a structured intent.
 */
export function parseVoiceIntent(rawTranscript) {
  if (
    typeof rawTranscript !== "string" ||
    !rawTranscript.trim()
  ) {
    return { type: "UNKNOWN", text: "", reason: "EMPTY_TRANSCRIPT" };
  }

  const normalized = normalizeBusinessSpeech(rawTranscript);

  const rawClean = normalized
    .replace(/[.,?!]+$/g, "")
    .trim();

  const text = stripConversationalPrefixes(rawClean);

  if (!text) {
    return { type: "UNKNOWN", text: "" };
  }

  // 1. Confirmations and cancellations.
  // The application must verify that a confirmation is pending.
  if (/^(confirm|yes|proceed|do it|correct|accept|yeah|yep|sure|okay|ok|right|exactly)$/i.test(rawClean)) {
    return { type: "CONFIRM" };
  }

  if (/^(cancel|no|stop|abort|discard|back|nope|never mind|nevermind|wrong|not that)$/i.test(rawClean)) {
    return { type: "CANCEL" };
  }

  // 2. Undo last action.
  if (/^(undo|undo that|revert|cancel last action|go back)$/i.test(text)) {
    return { type: "UNDO" };
  }

  // 3. Payment method selection.
  // Selecting a payment method does not complete a transaction.
  const paymentMatch = rawClean.match(
    /^(cash|mpesa|m-pesa|card|credit card)(?:\s+(\d+(?:\.\d{1,2})?))?$/i
  );

  if (paymentMatch) {
    const method = paymentMatch[1].toLowerCase() === "credit card"
      ? "CARD"
      : paymentMatch[1].toUpperCase().replace(/-/g, "");

    const amount = paymentMatch[2]
      ? parseNumber(paymentMatch[2])
      : null;

    if (paymentMatch[2] && amount === null) {
      return { type: "UNKNOWN", text, reason: "INVALID_PAYMENT_AMOUNT" };
    }

    return {
      type: "SELECT_PAYMENT_METHOD",
      method,
      amount,
    };
  }

  // 4. Select an option.
  const choice = parseSelectionChoice(text);

  if (choice !== null && text.split(/\s+/).length <= 2) {
    return {
      type: "SELECT_OPTION",
      choiceIndex: choice - 1,
    };
  }

  // 5. Withdraw money.
  const withdrawMatch = text.match(
    /^(?:withdraw|take out|draw)\s+(?:money\s+)?(?:kes\s+)?(\d+(?:\.\d{1,2})?)(?:\s+(?:for|reason)\s+(.+))?$/
  );

  if (withdrawMatch) {
    const amount = parseNumber(withdrawMatch[1]);

    if (amount === null || amount <= 0) {
      return { type: "UNKNOWN", text, reason: "INVALID_WITHDRAWAL_AMOUNT" };
    }

    return {
      type: "WITHDRAW_MONEY",
      amount,
      reason: (withdrawMatch[2] || "Cash Withdrawal").trim(),
      requiresConfirmation: true,
    };
  }

  // 6. Deduct stock for personal use, staff use, damage or expiry.
  const stockUseMatch = text.match(
    /^(?:deduct|record|take|remove)?\s*(\d+(?:\.\d+)?)\s*(kg|kgs|litres?|liters?|pcs?|units?|packets?|trays?|eggs?)?\s*(?:of\s+)?(.+?)\s+for\s+(personal use|staff use|internal use|damaged|damage|expired|expiry|spoilage|broken)$/i
  );

  if (stockUseMatch) {
    const quantity = parseNumber(stockUseMatch[1], MAX_QUANTITY);
    const query = stockUseMatch[3].trim();
    const reason = stockUseMatch[4].toLowerCase();

    if (quantity === null || quantity <= 0 || !isValidQuery(query)) {
      return { type: "UNKNOWN", text, reason: "INVALID_STOCK_DEDUCTION" };
    }

    return {
      type: "DEDUCT_STOCK_USE",
      query,
      quantity,
      reason,
      requiresConfirmation: true,
    };
  }

  // 7. Record expense.
  const expenseMatch = text.match(
    /^(?:record|add|save)\s+expense\s+(?:of\s+)?(?:kes\s+)?(\d+(?:\.\d{1,2})?)\s+(?:for\s+|on\s+)?(.+)$/
  );

  if (expenseMatch) {
    const amount = parseNumber(expenseMatch[1]);
    const notes = expenseMatch[2].trim();

    if (amount === null || amount <= 0 || !notes) {
      return { type: "UNKNOWN", text, reason: "INVALID_EXPENSE" };
    }

    return {
      type: "RECORD_EXPENSE",
      amount,
      notes,
      requiresConfirmation: true,
    };
  }

  // 8. Product price inquiry.
  const priceMatch = text.match(
    /^(?:how much is|price of|cost of|what is the price of)\s+(.+)$/i
  );

  if (priceMatch) {
    const query = priceMatch[1].trim();

    if (isValidQuery(query)) {
      return {
        type: "QUERY_PRODUCT_INFO",
        query,
        infoType: "PRICE",
      };
    }
  }

  // 9. Stock inquiry.
  const stockMatch = text.match(
    /^(?:how many|how much)\s+(.+?)(?:\s+in stock)?$|^(?:check stock|stock of|stock for)\s+(.+)$/i
  );

  if (stockMatch) {
    const query = (stockMatch[1] || stockMatch[2])
      .replace(/\s+(?:left|remaining)\s*$/i, "")
      .trim();

    if (isValidQuery(query)) {
      return {
        type: "QUERY_PRODUCT_INFO",
        query,
        infoType: "STOCK",
      };
    }
  }

  // 10. Account balance inquiry.
  if (
    /(?:account balance|cash balance|how much cash do we have|how much cash is in (?:the )?drawer|petty cash|shop balance)/i.test(text)
  ) {
    return { type: "QUERY_ACCOUNT_BALANCE" };
  }

  // 11. Add customer.
  const customerMatch = text.match(
    /^(?:save|add|create|register)\s+(?:new\s+)?customer\s+(.+?)(?:\s+(?:phone|number|mobile|tel)\s*[:,-]?\s*(\+?\d[\d\s-]{6,18}))?$/i
  );

  if (customerMatch) {
    const name = customerMatch[1].trim();
    const phone = customerMatch[2]
      ? customerMatch[2].replace(/[\s-]/g, "")
      : "";

    if (name && !/\d/.test(name) && isValidQuery(name)) {
      return {
        type: "ADD_CUSTOMER",
        name,
        phone,
        requiresConfirmation: true,
      };
    }
  }

  // 12. Sales analytics.
  if (
    /^(?:sales today|revenue today|profit today|performance today|summary today|how much did we make today)$/i.test(text)
  ) {
    return {
      type: "QUERY_ANALYTICS",
      subType: "TODAY_SALES",
    };
  }

  if (
    /^(?:compare sales|compare sales yesterday and today|sales comparison|how are we doing)$/i.test(text)
  ) {
    return {
      type: "QUERY_ANALYTICS",
      subType: "COMPARE_SALES",
    };
  }

  if (
    /^(?:low stock|show low stock|out of stock|restock alert|inventory alert)$/i.test(text)
  ) {
    return {
      type: "QUERY_ANALYTICS",
      subType: "LOW_STOCK",
    };
  }

  // 13. Record a direct sale.
  const recordSaleMatch = text.match(
    /^(?:record|make|save)\s+sale\s+(?:(\d+(?:\.\d+)?)\s*(kg|kgs|litres?|liters?|pcs?|units?|packets?)?\s*(?:of\s+)?)?(.+)$/
  );

  if (recordSaleMatch) {
    const quantity = recordSaleMatch[1]
      ? parseNumber(recordSaleMatch[1], MAX_QUANTITY)
      : 1;

    let query = recordSaleMatch[3].trim();
    let paymentMethod = null;
    let amountTendered = null;

    const paymentSuffix = query.match(
      /\s+(cash|mpesa|card)(?:\s+(\d+(?:\.\d{1,2})?))?$/i
    );

    if (paymentSuffix) {
      paymentMethod = paymentSuffix[1].toUpperCase();
      amountTendered = paymentSuffix[2]
        ? parseNumber(paymentSuffix[2])
        : null;

      if (paymentSuffix[2] && amountTendered === null) {
        return { type: "UNKNOWN", text, reason: "INVALID_PAYMENT_AMOUNT" };
      }

      query = query.slice(0, paymentSuffix.index).trim();
    }

    if (quantity === null || quantity <= 0 || !isValidQuery(query)) {
      return { type: "UNKNOWN", text, reason: "INVALID_SALE" };
    }

    return {
      type: "RECORD_SALE_DIRECT",
      query,
      quantity,
      unit: recordSaleMatch[2] || null,
      paymentMethod,
      amountTendered,
      requiresConfirmation: true,
    };
  }

  // 14. Clear cart.
  if (/^(?:clear|empty|reset|delete all)\s*(?:the\s+)?(?:cart|items|basket)?$/i.test(text)) {
    return {
      type: "CLEAR_CART",
      requiresConfirmation: true,
    };
  }

  // 15. Checkout / commit sale.
  const checkoutMatch = text.match(
    /^(?:checkout|pay|complete sale|process sale|finish sale|commit sale|complete checkout)(?:\s+(?:with\s+)?(?:kes\s+)?(\d+(?:\.\d{1,2})?))?(?:\s+(?:using\s+)?(cash|mpesa|card))?$/i
  );

  if (checkoutMatch) {
    const amount = checkoutMatch[1]
      ? parseNumber(checkoutMatch[1])
      : null;

    if (checkoutMatch[1] && amount === null) {
      return { type: "UNKNOWN", text, reason: "INVALID_CHECKOUT_AMOUNT" };
    }

    return {
      type: "CHECKOUT",
      amount,
      method: (checkoutMatch[2] || "CASH").toUpperCase(),
      requiresConfirmation: true,
    };
  }

  // 16. Remove item from cart.
  const removeMatch = text.match(
    /^(?:remove|delete|take out|minus)\s+(?:(\d+(?:\.\d+)?)\s+)?(.+)$/i
  );

  if (removeMatch) {
    const quantity = removeMatch[1]
      ? parseNumber(removeMatch[1], MAX_QUANTITY)
      : null;

    const query = removeMatch[2]
      .replace(/^(?:of|from cart)\s+/i, "")
      .trim();

    if (
      (removeMatch[1] && (quantity === null || quantity <= 0)) ||
      !isValidQuery(query)
    ) {
      return { type: "UNKNOWN", text, reason: "INVALID_REMOVE_ITEM" };
    }

    return {
      type: "REMOVE_ITEM",
      query,
      quantity,
      requiresConfirmation: true,
    };
  }

  // 17. Add item to cart.
  const addMatch = text.match(
    /^(?:add|put|give me|sell|sale|cell)\s+(?:(\d+(?:\.\d+)?)\s*(kg|kgs|litres?|liters?|pcs?|units?|packets?)?\s*(?:of\s+)?)?(.+)$/i
  );

  const quantityOnlyMatch = text.match(
    /^(\d+(?:\.\d+)?)\s+(.+)$/
  );

  const match = addMatch || quantityOnlyMatch;

  if (match) {
    const quantity = match[1]
      ? parseNumber(match[1], MAX_QUANTITY)
      : 1;

    let query;
    let unit = null;

    if (addMatch) {
      unit = match[2] || null;
      query = match[3].trim();
    } else {
      query = match[2].trim();
    }

    query = query.replace(/^(?:of|item|products?)\s+/i, "").trim();

    if (
      quantity !== null &&
      quantity > 0 &&
      isValidQuery(query)
    ) {
      return {
        type: "ADD_ITEM",
        query,
        quantity,
        unit,
        requiresConfirmation: true,
      };
    }
  }

  return {
    type: "UNKNOWN",
    text,
    reason: "UNRECOGNIZED_COMMAND",
  };
}

/**
 * Fuzzy product search.
 *
 * Matching priority:
 * 1. Exact match.
 * 2. Singular/plural-normalized match.
 * 3. Prefix match.
 * 4. Whole-token match.
 * 5. Conservative typo matching.
 *
 * Ambiguous matches are returned for user selection.
 */
export function matchProducts(query, productCatalog = []) {
  if (
    typeof query !== "string" ||
    !query.trim() ||
    !Array.isArray(productCatalog) ||
    productCatalog.length === 0
  ) {
    return { matchType: "NONE", matches: [] };
  }

  const normalizeName = (value) =>
    String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const cleanQuery = normalizeName(query);

  if (!cleanQuery) {
    return { matchType: "NONE", matches: [] };
  }

  const products = productCatalog
    .filter((product) =>
      product &&
      typeof product.name === "string" &&
      product.name.trim()
    )
    .map((product) => ({
      product,
      name: normalizeName(product.name),
    }));

  const unique = (items) => {
    const seen = new Set();

    return items.filter(({ product }) => {
      const key = product.id ?? product.name;

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
  };

  const result = (matchType, items) => ({
    matchType,
    matches: unique(items).map(({ product }) => product),
  });

  // 1. Exact match.
  const exact = products.filter(({ name }) => name === cleanQuery);

  if (exact.length === 1) return result("SINGLE", exact);
  if (exact.length > 1) return result("AMBIGUOUS", exact);

  // Conservative plural normalization.
  const singular = (value) =>
    value.replace(/\b([a-z]{4,})s\b/g, "$1");

  const singularQuery = singular(cleanQuery);

  const normalizedExact = products.filter(
    ({ name }) => singular(name) === singularQuery
  );

  if (normalizedExact.length === 1) {
    return result("SINGLE", normalizedExact);
  }

  if (normalizedExact.length > 1) {
    return result("AMBIGUOUS", normalizedExact);
  }

  // 2. Prefix matching.
  const prefix = products.filter(
    ({ name }) =>
      name.startsWith(cleanQuery) ||
      name.startsWith(singularQuery)
  );

  if (prefix.length === 1) return result("SINGLE", prefix);
  if (prefix.length > 1) return result("AMBIGUOUS", prefix);

  // 3. Whole-token matching.
  const queryTokens = singularQuery.split(" ").filter(Boolean);

  const tokenMatches = products.filter(({ name }) => {
    const productTokens = singular(name).split(" ");

    return queryTokens.every((token) =>
      productTokens.includes(token)
    );
  });

  if (tokenMatches.length === 1) {
    return result("SINGLE", tokenMatches);
  }

  if (tokenMatches.length > 1) {
    return result("AMBIGUOUS", tokenMatches.slice(0, 5));
  }

  // 4. Conservative typo matching.
  function levenshtein(a, b) {
    const row = Array.from(
      { length: b.length + 1 },
      (_, index) => index
    );

    for (let i = 1; i <= a.length; i++) {
      let previous = row[0];
      row[0] = i;

      for (let j = 1; j <= b.length; j++) {
        const old = row[j];

        row[j] = Math.min(
          row[j] + 1,
          row[j - 1] + 1,
          previous + (a[i - 1] === b[j - 1] ? 0 : 1)
        );

        previous = old;
      }
    }

    return row[b.length];
  }

  const ranked = products
    .map((entry) => {
      const name = singular(entry.name);
      const distance = levenshtein(singularQuery, name);
      const length = Math.max(singularQuery.length, name.length);

      return {
        ...entry,
        distance,
        score: length === 0 ? 1 : 1 - distance / length,
      };
    })
    .filter(({ score, distance }) =>
      score >= 0.78 &&
      distance <= (singularQuery.length <= 5 ? 1 : 2)
    )
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 1) {
    return result("SINGLE", ranked);
  }

  if (ranked.length > 1) {
    const scoreDifference = ranked[0].score - ranked[1].score;

    if (scoreDifference >= 0.15) {
      return result("SINGLE", [ranked[0]]);
    }

    return result("AMBIGUOUS", ranked.slice(0, 5));
  }

  return { matchType: "NONE", matches: [] };
}

/**
 * Basic regression tests.
 *
 * Run runVoiceParserTests() in your development environment.
 */
export function runVoiceParserTests() {
  const tests = [
    {
      input: "add two milk",
      type: "ADD_ITEM",
      field: "quantity",
      expected: 2,
    },
    {
      input: "add five hundred sugar",
      type: "ADD_ITEM",
      field: "quantity",
      expected: 500,
    },
    {
      input: "record expense two hundred for electricity",
      type: "RECORD_EXPENSE",
      field: "amount",
      expected: 200,
    },
    {
      input: "withdraw one thousand for lunch",
      type: "WITHDRAW_MONEY",
      field: "amount",
      expected: 1000,
    },
    {
      input: "how much is sugar",
      type: "QUERY_PRODUCT_INFO",
      field: "infoType",
      expected: "PRICE",
    },
    {
      input: "how many eggs in stock",
      type: "QUERY_PRODUCT_INFO",
      field: "infoType",
      expected: "STOCK",
    },
    {
      input: "sales today",
      type: "QUERY_ANALYTICS",
      field: "subType",
      expected: "TODAY_SALES",
    },
    {
      input: "compare sales",
      type: "QUERY_ANALYTICS",
      field: "subType",
      expected: "COMPARE_SALES",
    },
    {
      input: "mpesa",
      type: "SELECT_PAYMENT_METHOD",
      field: "method",
      expected: "MPESA",
    },
    {
      input: "remove two milk",
      type: "REMOVE_ITEM",
      field: "quantity",
      expected: 2,
    },
    {
      input: "clear cart",
      type: "CLEAR_CART",
    },
    {
      input: "confirm",
      type: "CONFIRM",
    },
    {
      input: "cancel",
      type: "CANCEL",
    },
    {
      input: "commit sale",
      type: "CHECKOUT",
    },
    {
      input: "unrecognized sentence",
      type: "UNKNOWN",
    },
    {
      input: "withdraw zero for lunch",
      type: "UNKNOWN",
    },
  ];

  return tests.map((test) => {
    const actual = parseVoiceIntent(test.input);

    const passed =
      actual.type === test.type &&
      (
        test.field === undefined ||
        actual[test.field] === test.expected
      );

    return {
      input: test.input,
      expected: test.type,
      actual: actual.type,
      passed,
    };
  });
} 
