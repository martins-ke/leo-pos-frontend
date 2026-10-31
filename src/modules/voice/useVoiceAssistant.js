import { useState, useEffect, useRef, useCallback } from 'react';
import { speechEngine } from './speechEngine';
import { parseVoiceIntent, matchProducts, parseSelectionChoice } from './voiceGrammar';
import { executeAiBusinessQuery } from './aiQueryRouter';
import { api } from '../../api/api';

/**
 * Pro Shop AI & Voice Agent Controller with Rephrase-and-Confirm Loop.
 * 
 * Pattern:     
 * 1. Understands conversational sentences (e.g. "I took 5 eggs for personal use", "Can we withdraw 500 for lunch")
 * 2. Compares against inventory and backend models
 * 3. Rephrases the intent cleanly: "I understood: You want to [Rephrased Action]. Is that correct?"
 * 4. Awaits confirmation ("Yes" / "No") before committing.
 */
export function useVoiceAssistant({    
  products = [],
  cart = [],
  grandTotal = 0,
  selectedShopId = '',
  enabled = true,
  onAddToCart,
  onUpdateQty,
  onRemoveFromCart,
  onClearCart,
  onCheckout,
  refreshProducts,
  onAddCustomerSuccess,
}) {
  const [isSupported] = useState(() => speechEngine.isSupported && enabled);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantMessage, setAssistantMessage] = useState('Shop Assistant ready. Speak naturally or tap mic.');
  const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'speaking' | 'disambiguating' | 'confirming' | 'processing'

  // Contextual modal/interaction states
  const [disambiguation, setDisambiguation] = useState(null); // { query, quantity, candidates: [] }
  const [pendingConfirmation, setPendingConfirmation] = useState(null); // { type, rephrase, impact, payload }
  const [pendingPaymentChoice, setPendingPaymentChoice] = useState(null); // { product, qty, total, isCartCheckout }
  const [stockDecision, setStockDecision] = useState(null); // { product, requestedQty, availableQty }
  const [analyticsData, setAnalyticsData] = useState(null);

  const productsRef = useRef(products);
  const cartRef = useRef(cart);
  const grandTotalRef = useRef(grandTotal);
  const shopIdRef = useRef(selectedShopId);
  const undoStackRef = useRef([]);

  useEffect(() => { productsRef.current = products; }, [products]);
  useEffect(() => { cartRef.current = cart; }, [cart]);
  useEffect(() => { grandTotalRef.current = grandTotal; }, [grandTotal]);
  useEffect(() => { shopIdRef.current = selectedShopId; }, [selectedShopId]);

  useEffect(() => {
    if (!enabled) {
      setIsListening(false);
      setIsSpeaking(false);
      setTranscript('');
      setAssistantMessage('Voice assistant is disabled. The POS remains fully usable without it.');
      setStatus('idle');
      speechEngine.stopListening();
      speechEngine.cancelSpeech();
    }
  }, [enabled]);

  const speakAndDisplay = useCallback((text, chime = 'success', nextStatus = 'idle') => {
    if (!enabled) return;
    setAssistantMessage(text);
    setStatus('speaking');
    setIsSpeaking(true);
    speechEngine.playChime(chime);

    speechEngine.speak(text, () => {
      setIsSpeaking(false);
      setStatus(nextStatus);
    });
  }, []);

  // Safe commit item to cart
  const commitAddToCart = useCallback((product, requestedQty = 1) => {
    const currentProducts = productsRef.current;
    const currentCart = cartRef.current;

    const liveProduct = currentProducts.find(p => p.id === product.id) || product;
    const storeQty = parseFloat(liveProduct.quantity) || 0;

    if (storeQty <= 0) {
      speakAndDisplay(`Sorry, ${liveProduct.name} is completely out of stock in this outlet.`, 'warning');
      return;
    }

    const existingInCart = currentCart.find(i => i.id === liveProduct.id);
    const inCartQty = existingInCart ? existingInCart.qty : 0;
    const remainingInStore = storeQty - inCartQty;

    if (remainingInStore <= 0) {
      speakAndDisplay(`Cannot add more. All ${storeQty} available units of ${liveProduct.name} are already in cart.`, 'warning');
      return;
    }

    if (requestedQty > remainingInStore) {
      setStockDecision({
        product: liveProduct,
        requestedQty,
        availableQty: remainingInStore,
      });
      setStatus('disambiguating');
      speakAndDisplay(
        `Less stock available for ${liveProduct.name}. Requested ${requestedQty}, but only ${remainingInStore} remain in store. Would you like to add ${remainingInStore}? Say yes or no.`,
        'warning',
        'disambiguating'
      );
      return;
    }

    // Save state to undo stack
    undoStackRef.current.push({
      action: 'ADD_CART_ITEM',
      productId: liveProduct.id,
      prevCart: [...currentCart],
      description: `addition of ${liveProduct.name}`,
    });

    if (onAddToCart) {
      if (existingInCart) {
        onUpdateQty(liveProduct.id, inCartQty + requestedQty);
      } else {
        onAddToCart(liveProduct, requestedQty);
      }
    }

    const unitStr = liveProduct.unit ? ` ${liveProduct.unit}` : '';
    speakAndDisplay(`Added ${requestedQty}${unitStr} of ${liveProduct.name} to cart.`, 'success');
  }, [onAddToCart, onUpdateQty, speakAndDisplay]);

  // Handle Undo
  const handleUndo = useCallback(() => {
    const stack = undoStackRef.current;
    if (stack.length === 0) {
      speakAndDisplay('Nothing to undo.', 'warning');
      return;
    }

    const lastAction = stack.pop();

    if (lastAction.action === 'ADD_CART_ITEM' || lastAction.action === 'REMOVE_CART_ITEM') {
      if (onClearCart) onClearCart();
      if (lastAction.prevCart && lastAction.prevCart.length > 0) {
        lastAction.prevCart.forEach(item => {
          onAddToCart(item, item.qty);
        });
      }
      speakAndDisplay(`Undone. Restored cart prior to ${lastAction.description}.`, 'success');
      return;
    }

    speakAndDisplay(`Undone last action: ${lastAction.description || 'action reversed'}.`, 'success');
  }, [onAddToCart, onClearCart, speakAndDisplay]);

  // Handle Payment Method Selection
  const selectPaymentMethod = useCallback((chosenMethod, customAmount = null) => {
    if (!pendingPaymentChoice) return;
    const method = chosenMethod.toUpperCase();
    const choice = pendingPaymentChoice;
    setPendingPaymentChoice(null);

    if (choice.isCartCheckout) {
      const total = choice.total;
      const tendered = customAmount || total;
      const change = Math.max(0, tendered - total);
      const rephrase = `Finalize sale of KES ${total.toLocaleString()} with ${method}`;

      setPendingConfirmation({
        type: 'CHECKOUT',
        rephrase,
        impact: change > 0 ? `Change to return: KES ${change.toLocaleString()}` : 'Exact payment',
        payload: { method, tendered, change, total },
      });
      setStatus('confirming');
      speakAndDisplay(
        `I understood: You want to finalize this sale for KES ${total.toLocaleString()} with ${method}. Is that correct? Say yes or no.`,
        'warning',
        'confirming'
      );
    } else {
      const { product, qty, total } = choice;
      const tendered = customAmount || total;
      const change = Math.max(0, tendered - total);
      const rephrase = `Record sale for ${qty} ${product.name} at KES ${total.toLocaleString()}`;

      // Preview in cart
      commitAddToCart(product, qty);

      setPendingConfirmation({
        type: 'RECORD_SALE_DIRECT',
        rephrase,
        impact: `Payment: ${method} (${tendered.toLocaleString()})${change > 0 ? ` with change KES ${change.toLocaleString()}` : ''}`,
        payload: { method, tendered, change, total },
      });
      setStatus('confirming');
      speakAndDisplay(
        `I understood: You want to sell ${qty} of ${product.name} for KES ${total.toLocaleString()} with ${method}. Is that correct? Say yes to finalize or no to cancel.`,
        'warning',
        'confirming'
      );
    }
  }, [commitAddToCart, pendingPaymentChoice, speakAndDisplay]);

  // Main voice input pipeline with Rephrase-and-Confirm
  const handleVoiceTranscript = useCallback(async (rawText) => {
    if (!enabled || !rawText) return;
    setTranscript(rawText);

    const intent = parseVoiceIntent(rawText);

    // 1. Handling Awaiting Confirmation (User replying "Yes" / "No")
    if (pendingConfirmation) {
      if (intent.type === 'CONFIRM') {
        const conf = pendingConfirmation;
        setPendingConfirmation(null);

        // A. Direct Sale Finalize
        if (conf.type === 'CHECKOUT' || conf.type === 'RECORD_SALE_DIRECT') {
          setStatus('processing');
          speakAndDisplay('Processing sale transaction...', 'start', 'processing');

          if (onCheckout) {
            try {
              const res = await onCheckout(conf.payload);
              if (res && res.success) {
                if (refreshProducts) await refreshProducts();
                speakAndDisplay(
                  `Sale successful! Receipt number ${res.receiptNumber || 'generated'}. Payment complete.`,
                  'success'
                );
              } else {
                speakAndDisplay(`Sale rejected: ${res?.message || 'Stock inconsistency or error.'}`, 'warning');
              }
            } catch {
              speakAndDisplay('Network connection error while finalizing sale.', 'warning');
            }
          }
          return;
        }

        // B. Add Item to Cart
        if (conf.type === 'ADD_ITEM') {
          commitAddToCart(conf.payload.product, conf.payload.quantity);
          return;
        }

        // C. Confirm Cash Withdrawal
        if (conf.type === 'WITHDRAW') {
          setStatus('processing');
          speakAndDisplay('Recording cash withdrawal from shop account...', 'start', 'processing');

          try {
            const activeShop = shopIdRef.current || localStorage.getItem('leo_active_shop');
            const res = await api.post(`/accounts/${activeShop}/drawings`, {
              amount: conf.payload.amount,
              paymentMethod: 'CASH',
              description: conf.payload.reason,
              confirmOverProfit: true,
            });

            if (res.success) {
              speakAndDisplay(`Withdrawal of KES ${conf.payload.amount} for ${conf.payload.reason} recorded successfully.`, 'success');
            } else {
              speakAndDisplay(`Could not record withdrawal: ${res.message || 'Account error.'}`, 'warning');
            }
          } catch {
            speakAndDisplay('Error connecting to accounts service.', 'warning');
          }
          return;
        }

        // D. Confirm Stock Deduction (Personal Use, Spoilage, Damage)
        if (conf.type === 'DEDUCT_STOCK_USE') {
          setStatus('processing');
          speakAndDisplay('Recording stock deduction for personal use...', 'start', 'processing');

          try {
            const activeShop = shopIdRef.current || localStorage.getItem('leo_active_shop');
            const res = await api.post('/inventory/withdrawals', {
              shopId: activeShop,
              productId: conf.payload.productId,
              quantity: conf.payload.quantity,
              reason: conf.payload.reason,
            });

            if (res.success) {
              if (refreshProducts) await refreshProducts();
              speakAndDisplay(
                `Deducted ${conf.payload.quantity} ${conf.payload.productName} for ${conf.payload.reason}. Stock updated.`,
                'success'
              );
            } else {
              speakAndDisplay(`Failed to deduct stock: ${res.message || 'Error occurred.'}`, 'warning');
            }
          } catch {
            speakAndDisplay('Error connecting to inventory withdrawal service.', 'warning');
          }
          return;
        }

        // E. Confirm Customer Registration
        if (conf.type === 'ADD_CUSTOMER') {
          setStatus('processing');
          speakAndDisplay('Registering customer...', 'start', 'processing');
          try {
            const activeShop = shopIdRef.current || localStorage.getItem('leo_active_shop');
            const res = await api.post('/customers', {
              shopId: activeShop,
              name: conf.payload.name,
              phone: conf.payload.phone || '',
            });

            if (res.success && res.body) {
              undoStackRef.current.push({
                action: 'ADD_CUSTOMER',
                description: `customer ${conf.payload.name}`,
              });
              if (onAddCustomerSuccess) onAddCustomerSuccess(res.body);
              speakAndDisplay(`Customer ${conf.payload.name} registered successfully.`, 'success');
            } else {
              speakAndDisplay(`Could not register customer: ${res.message || 'Validation error'}`, 'warning');
            }
          } catch {
            speakAndDisplay('Failed to register customer due to connection error.', 'warning');
          }
          return;
        }

        // F. Confirm General Expense
        if (conf.type === 'RECORD_EXPENSE') {
          setStatus('processing');
          speakAndDisplay('Recording expense...', 'start', 'processing');

          try {
            const activeShop = shopIdRef.current || localStorage.getItem('leo_active_shop');
            const todayStr = new Date().toISOString().split('T')[0];
            const res = await api.post('/expenses', {
              shopId: activeShop,
              category: 'GENERAL',
              amount: conf.payload.amount,
              expenseDate: todayStr,
              paymentMethod: 'CASH',
              notes: conf.payload.notes,
            });

            if (res.success) {
              speakAndDisplay(`Expense of KES ${conf.payload.amount} for ${conf.payload.notes} recorded successfully.`, 'success');
            } else {
              speakAndDisplay(`Could not record expense: ${res.message || 'Validation error'}`, 'warning');
            }
          } catch {
            speakAndDisplay('Error connecting to expense service.', 'warning');
          }
          return;
        }

        // G. Confirm Clear Cart
        if (conf.type === 'CLEAR_CART') {
          if (onClearCart) onClearCart();
          speakAndDisplay('Cart has been cleared.', 'success');
          return;
        }

        return;
      }

      if (intent.type === 'CANCEL') {
        setPendingConfirmation(null);
        speakAndDisplay('Cancelled. What would you like to do instead?', 'warning');
        return;
      }

      speakAndDisplay(`I'm waiting for your confirmation. Say "Yes" to proceed or "No" to cancel.`, 'warning', 'confirming');
      return;
    }

    // 1b. Handling Awaiting Payment Method Selection (Cash, M-Pesa, Card)
    if (pendingPaymentChoice) {
      if (intent.type === 'CANCEL') {
        setPendingPaymentChoice(null);
        speakAndDisplay('Sale cancelled.', 'warning');
        return;
      }

      if (intent.type === 'SELECT_PAYMENT_METHOD') {
        selectPaymentMethod(intent.method, intent.amount);
        return;
      }

      speakAndDisplay('Please state how the customer is paying: Cash, M-Pesa, or Card, or say cancel.', 'warning', 'disambiguating');
      return;
    }

    // 2. Handling Awaiting Stock Decision
    if (stockDecision) {
      if (intent.type === 'CONFIRM') {
        const { product, availableQty } = stockDecision;
        setStockDecision(null);
        commitAddToCart(product, availableQty);
        return;
      }
      if (intent.type === 'CANCEL') {
        setStockDecision(null);
        speakAndDisplay('Cancelled adding item.', 'warning');
        return;
      }
      speakAndDisplay(`Say "yes" to add ${stockDecision.availableQty} or "no" to cancel.`, 'warning', 'disambiguating');
      return;
    }

    // 3. Handling Disambiguation (Multiple item matches)
    if (disambiguation) {
      if (intent.type === 'CANCEL') {
        setDisambiguation(null);
        speakAndDisplay('Selection cancelled.', 'warning');
        return;
      }

      let selectedIdx = null;
      if (intent.type === 'SELECT_OPTION') {
        selectedIdx = intent.choiceIndex;
      } else {
        const choice = parseSelectionChoice(rawText, disambiguation.candidates.length);
        if (choice !== null) selectedIdx = choice - 1;
      }

      if (selectedIdx === null) {
        const subMatch = matchProducts(rawText, disambiguation.candidates);
        if (subMatch.matchType === 'SINGLE') {
          selectedIdx = disambiguation.candidates.findIndex(c => c.id === subMatch.matches[0].id);
        }
      }

      if (selectedIdx !== null && disambiguation.candidates[selectedIdx]) {
        const chosen = disambiguation.candidates[selectedIdx];
        const qty = disambiguation.quantity || 1;
        setDisambiguation(null);
        commitAddToCart(chosen, qty);
        return;
      }

      speakAndDisplay(
        `Please choose option 1 to ${disambiguation.candidates.length}, or say cancel.`,
        'warning',
        'disambiguating'
      );
      return;
    }

    // 4. AI-backed business queries mapped to real backend URLs
    const aiResult = await executeAiBusinessQuery(rawText, {
      activeShopId: shopIdRef.current,
      selectedShopId: shopIdRef.current,
      userRole: (() => {
        try {
          return JSON.parse(localStorage.getItem('leo_user') || '{}')?.role || 'STAFF';
        } catch {
          return 'STAFF';
        }
      })(),
    });
    if (aiResult && !['CANCEL', 'CONFIRM'].includes(intent.type)) {
      speakAndDisplay(aiResult.answer, aiResult.chime || 'success');
      return;
    }

    // 5. Standard Shop Voice Commands: Rephrase and Confirm Pattern
    switch (intent.type) {
      case 'UNDO': {
        handleUndo();
        break;
      }

      // Deduct stock for personal use / staff use / damage / expired
      case 'DEDUCT_STOCK_USE': {
        const match = matchProducts(intent.query, productsRef.current);

        if (match.matchType === 'NONE') {
          speakAndDisplay(`Could not find any product matching "${intent.query}".`, 'warning');
        } else if (match.matchType === 'AMBIGUOUS') {
          setDisambiguation({
            query: intent.query,
            quantity: intent.quantity,
            candidates: match.matches.slice(0, 4),
          });
          setStatus('disambiguating');
          speakAndDisplay(`Found multiple items matching "${intent.query}". Which one? Say option 1, option 2, or cancel.`, 'ambiguous', 'disambiguating');
        } else {
          const product = match.matches[0];
          const qty = intent.quantity || 1;
          const storeQty = parseFloat(product.quantity) || 0;

          if (storeQty <= 0) {
            speakAndDisplay(`Sorry, ${product.name} is completely out of stock. Cannot deduct.`, 'warning');
            return;
          }

          if (qty > storeQty) {
            speakAndDisplay(`Insufficient stock for ${product.name}. You requested to deduct ${qty}, but only ${storeQty} remain in store.`, 'warning');
            return;
          }

          const unitStr = product.unit ? ` ${product.unit}` : '';
          const rephrase = `Deduct ${qty}${unitStr} of ${product.name} for ${intent.reason}`;
          setPendingConfirmation({
            type: 'DEDUCT_STOCK_USE',
            rephrase,
            impact: `Stock reduces from ${storeQty} to ${storeQty - qty} units.`,
            payload: {
              productId: product.id,
              productName: product.name,
              quantity: qty,
              reason: intent.reason || 'personal use',
              currentStock: storeQty,
            },
          });
          setStatus('confirming');

          speakAndDisplay(
            `I understood: You want to ${rephrase.toLowerCase()}. Is that correct? Say yes or no.`,
            'warning',
            'confirming'
          );
        }
        break;
      }

      // Direct Sale Record
      case 'RECORD_SALE_DIRECT': {
        const match = matchProducts(intent.query, productsRef.current);

        if (match.matchType === 'NONE') {
          speakAndDisplay(`Could not find any product matching "${intent.query}".`, 'warning');
        } else if (match.matchType === 'AMBIGUOUS') {
          setDisambiguation({
            query: intent.query,
            quantity: intent.quantity,
            candidates: match.matches.slice(0, 4),
          });
          setStatus('disambiguating');
          speakAndDisplay(`Found multiple items for "${intent.query}". Please select option 1 or 2.`, 'ambiguous', 'disambiguating');
        } else {
          const product = match.matches[0];
          const qty = intent.quantity || 1;
          const storeQty = parseFloat(product.quantity) || 0;

          if (storeQty <= 0) {
            speakAndDisplay(`Sorry, ${product.name} is completely out of stock in this shop.`, 'warning');
            return;
          }

          if (qty > storeQty) {
            speakAndDisplay(`Insufficient stock for ${product.name}. Requested ${qty}, but only ${storeQty} in store.`, 'warning');
            return;
          }

          const unitPrice = parseFloat(product.selling_price || product.sellingPrice || 0);
          const total = Math.round(unitPrice * qty);

          // If payment method is not specified in the voice statement, ask explicitly!
          if (!intent.paymentMethod) {
            setPendingPaymentChoice({
              product,
              qty,
              total,
              unitPrice,
            });
            setStatus('disambiguating');
            speakAndDisplay(
              `Found ${qty} of ${product.name}. Total is KES ${total.toLocaleString()}. How is the customer paying? Cash, M-Pesa, or Card?`,
              'warning',
              'disambiguating'
            );
            return;
          }

          const method = intent.paymentMethod;
          const tendered = intent.amountTendered || total;
          const change = Math.max(0, tendered - total);

          // Add to cart preview
          commitAddToCart(product, qty);

          const rephrase = `Record sale for ${qty} ${product.name} at KES ${total.toLocaleString()}`;
          setPendingConfirmation({
            type: 'RECORD_SALE_DIRECT',
            rephrase,
            impact: `Payment: ${method} (${tendered.toLocaleString()})${change > 0 ? ` with change KES ${change.toLocaleString()}` : ''}`,
            payload: {
              method,
              tendered,
              change,
              total,
            },
          });
          setStatus('confirming');

          speakAndDisplay(
            `I understood: You want to sell ${qty} of ${product.name} for KES ${total.toLocaleString()} with ${method}. Is that correct? Say yes to finalize or no to cancel.`,
            'warning',
            'confirming'
          );
        }
        break;
      }

      // Add Item to Cart
      case 'ADD_ITEM': {
        const match = matchProducts(intent.query, productsRef.current);

        if (match.matchType === 'NONE') {
          speakAndDisplay(`No product found in stock matching "${intent.query}".`, 'warning');
        } else if (match.matchType === 'SINGLE') {
          const product = match.matches[0];
          const qty = intent.quantity || 1;
          const unitPrice = parseFloat(product.selling_price || product.sellingPrice || 0);
          const total = Math.round(unitPrice * qty);

          const rephrase = `Add ${qty} ${product.name} to the cart`;
          setPendingConfirmation({
            type: 'ADD_ITEM',
            rephrase,
            impact: `Price: KES ${total.toLocaleString()}`,
            payload: { product, quantity: qty },
          });
          setStatus('confirming');

          speakAndDisplay(
            `I understood: You want to add ${qty} of ${product.name} to the cart. Is that correct? Say yes or no.`,
            'warning',
            'confirming'
          );
        } else if (match.matchType === 'AMBIGUOUS') {
          const candidates = match.matches.slice(0, 4);
          setDisambiguation({
            query: intent.query,
            quantity: intent.quantity,
            candidates,
          });
          setStatus('disambiguating');
          const optionsSpeech = candidates
            .map((c, i) => `Option ${i + 1}: ${c.name} at KES ${c.selling_price || c.sellingPrice}`)
            .join('. ');

          speakAndDisplay(
            `Found ${candidates.length} items matching "${intent.query}". ${optionsSpeech}. Which one? Say option 1, option 2, or cancel.`,
            'ambiguous',
            'disambiguating'
          );
        }
        break;
      }

      // Cash Withdrawal from Shop Account
      case 'WITHDRAW_MONEY': {
        const rephrase = `Withdraw KES ${intent.amount.toLocaleString()} for ${intent.reason}`;
        setPendingConfirmation({
          type: 'WITHDRAW',
          rephrase,
          impact: 'Source: Shop Petty Cash / Drawings',
          payload: {
            amount: intent.amount,
            reason: intent.reason,
          },
        });
        setStatus('confirming');
        speakAndDisplay(
          `I understood: You want to withdraw KES ${intent.amount.toLocaleString()} for ${intent.reason} from shop cash. Is that correct? Say yes or no.`,
          'warning',
          'confirming'
        );
        break;
      }

      // Customer Registration
      case 'ADD_CUSTOMER': {
        const phoneStr = intent.phone ? ` (Phone: ${intent.phone})` : '';
        const rephrase = `Register new customer ${intent.name}${phoneStr}`;
        setPendingConfirmation({
          type: 'ADD_CUSTOMER',
          rephrase,
          impact: 'Will appear in your customer directory and ledger.',
          payload: {
            name: intent.name,
            phone: intent.phone || '',
          },
        });
        setStatus('confirming');
        speakAndDisplay(
          `I understood: You want to register new customer ${intent.name}. Should I save them? Say yes or no.`,
          'warning',
          'confirming'
        );
        break;
      }

      // Record Expense
      case 'RECORD_EXPENSE': {
        const rephrase = `Record expense of KES ${intent.amount.toLocaleString()} for ${intent.notes}`;
        setPendingConfirmation({
          type: 'RECORD_EXPENSE',
          rephrase,
          impact: 'Payment method: Cash expense',
          payload: {
            amount: intent.amount,
            notes: intent.notes,
          },
        });
        setStatus('confirming');
        speakAndDisplay(
          `I understood: You want to record an expense of KES ${intent.amount.toLocaleString()} for ${intent.notes}. Is that correct? Say yes or no.`,
          'warning',
          'confirming'
        );
        break;
      }

      // Query Product Price or Stock (Instant Answer)
      case 'QUERY_PRODUCT_INFO': {
        const match = matchProducts(intent.query, productsRef.current);
        if (match.matchType === 'NONE') {
          speakAndDisplay(`Could not find "${intent.query}" in inventory.`, 'warning');
        } else if (match.matchType === 'AMBIGUOUS') {
          const list = match.matches.slice(0, 3).map(p => p.name).join(', ');
          speakAndDisplay(`Found multiple items for "${intent.query}": ${list}. Please specify exact name.`, 'warning');
        } else {
          const p = match.matches[0];
          const price = parseFloat(p.selling_price || p.sellingPrice || 0).toLocaleString();
          const stock = p.quantity || 0;
          const unit = p.unit ? ` ${p.unit}` : ' units';

          if (intent.infoType === 'PRICE') {
            speakAndDisplay(`${p.name} is selling at KES ${price}. You currently have ${stock}${unit} in stock.`, 'success');
          } else {
            speakAndDisplay(`${p.name} has ${stock}${unit} available in stock at KES ${price}.`, 'success');
          }
        }
        break;
      }

      // Query Shop Account Balance (Instant Answer)
      case 'QUERY_ACCOUNT_BALANCE': {
        try {
          const activeShop = shopIdRef.current || localStorage.getItem('leo_active_shop') || '';
          const res = await api.get(`/accounts/${activeShop}/summary`);
          if (res.success && res.body) {
            const acc = res.body;
            const bal = parseFloat(acc.accountBalance || 0).toLocaleString();
            const profit = parseFloat(acc.netProfit || 0).toLocaleString();
            speakAndDisplay(`Shop account balance is KES ${bal}. Net profit after operating expenses is KES ${profit}.`, 'success');
          } else {
            speakAndDisplay('Could not retrieve account balance right now.', 'warning');
          }
        } catch {
          speakAndDisplay('Unable to connect to shop accounts.', 'warning');
        }
        break;
      }

      // Shop Analytics / Sales Queries (Instant Answer)
      case 'QUERY_ANALYTICS': {
        try {
          const activeShop = shopIdRef.current || localStorage.getItem('leo_active_shop') || '';
          const res = await api.get(`/dashboard/summary${activeShop ? `?shopId=${activeShop}` : ''}`);

          if (res.success && res.body) {
            const summary = res.body;
            setAnalyticsData(summary);
            const todayRev = parseFloat(summary.todayRevenue || 0).toLocaleString();
            const todayProfit = parseFloat(summary.todayGrossProfit || 0).toLocaleString();
            const salesCount = summary.totalSalesToday || 0;
            const lowStock = summary.lowStockCount || 0;

            if (intent.subType === 'LOW_STOCK') {
              speakAndDisplay(
                lowStock > 0
                  ? `There are ${lowStock} products running low on stock.`
                  : 'All inventory stock levels are currently healthy.',
                'success'
              );
            } else if (intent.subType === 'COMPARE_SALES') {
              speakAndDisplay(
                `Today you have generated KES ${todayRev} across ${salesCount} sales with gross profit of KES ${todayProfit}.`,
                'success'
              );
            } else {
              speakAndDisplay(
                `Today's sales total is KES ${todayRev} from ${salesCount} transactions. Gross profit is KES ${todayProfit}.`,
                'success'
              );
            }
          } else {
            speakAndDisplay('Could not retrieve sales statistics right now.', 'warning');
          }
        } catch {
          speakAndDisplay('Unable to connect to dashboard analytics.', 'warning');
        }
        break;
      }

      // Clear Cart
      case 'CLEAR_CART': {
        if (cartRef.current.length === 0) {
          speakAndDisplay('Cart is already empty.', 'warning');
          return;
        }
        const rephrase = 'Empty all items from the cart';
        setPendingConfirmation({
          type: 'CLEAR_CART',
          rephrase,
          impact: `${cartRef.current.length} items will be removed`,
        });
        setStatus('confirming');
        speakAndDisplay('I understood: You want to clear the entire cart. Is that correct? Say yes or no.', 'warning', 'confirming');
        break;
      }

      // Checkout
      case 'CHECKOUT': {
        const currentCart = cartRef.current;
        const total = grandTotalRef.current;

        if (currentCart.length === 0) {
          speakAndDisplay('Cart is empty. Add items before checking out.', 'warning');
          return;
        }

        // If payment method is not specified in checkout, ask explicitly!
        if (!intent.method) {
          setPendingPaymentChoice({
            total,
            isCartCheckout: true,
          });
          setStatus('disambiguating');
          speakAndDisplay(
            `Total is KES ${total.toLocaleString()}. How is the customer paying? Cash, M-Pesa, or Card?`,
            'warning',
            'disambiguating'
          );
          return;
        }

        const method = intent.method;
        let tendered = intent.amount;

        if (method === 'CASH') {
          if (!tendered) {
            tendered = total;
          } else if (tendered < total) {
            speakAndDisplay(`Invalid amount. Total due is KES ${total.toLocaleString()}, but tendered is only ${tendered}.`, 'warning');
            return;
          }
        } else {
          tendered = total;
        }

        const change = Math.max(0, tendered - total);
        const rephrase = `Finalize sale of KES ${total.toLocaleString()} with ${method}`;

        setPendingConfirmation({
          type: 'CHECKOUT',
          rephrase,
          impact: change > 0 ? `Change to return: KES ${change.toLocaleString()}` : 'Exact payment',
          payload: {
            method,
            tendered,
            change,
            total,
          },
        });
        setStatus('confirming');

        const changePhrase = change > 0 ? `, with change of KES ${change.toLocaleString()}` : '';
        speakAndDisplay(
          `I understood: You want to finalize this sale for KES ${total.toLocaleString()} with ${method}${changePhrase}. Is that correct? Say yes or no.`,
          'warning',
          'confirming'
        );
        break;
      }

      // Remove from Cart
      case 'REMOVE_ITEM': {
        const currentCart = cartRef.current;
        if (currentCart.length === 0) {
          speakAndDisplay('Cart is empty. Nothing to remove.', 'warning');
          return;
        }

        const match = matchProducts(intent.query, currentCart);
        if (match.matchType === 'NONE') {
          speakAndDisplay(`Could not find ${intent.query} in the current cart.`, 'warning');
        } else if (match.matchType === 'SINGLE') {
          const item = match.matches[0];
          undoStackRef.current.push({
            action: 'REMOVE_CART_ITEM',
            prevCart: [...currentCart],
            description: `removal of ${item.name}`,
          });

          if (intent.quantity && item.qty > intent.quantity) {
            onUpdateQty(item.id, item.qty - intent.quantity);
            speakAndDisplay(`Reduced ${item.name} by ${intent.quantity}. ${item.qty - intent.quantity} remaining in cart.`, 'success');
          } else {
            onRemoveFromCart(item.id);
            speakAndDisplay(`Removed ${item.name} from cart.`, 'success');
          }
        } else {
          speakAndDisplay(`Multiple items in cart match "${intent.query}". Please specify.`, 'warning');
        }
        break;
      }

      default:
        speakAndDisplay(`I didn't quite catch that. You can say: "Deduct 5 eggs for personal use", "Record sale for 2kg sugar", "Withdraw 500 for lunch", or "Sales today".`, 'warning');
        break;
    }
  }, [commitAddToCart, disambiguation, handleUndo, onClearCart, onCheckout, onRemoveFromCart, onUpdateQty, pendingConfirmation, refreshProducts, speakAndDisplay, stockDecision, onAddCustomerSuccess]);

  const toggleListening = () => {
    if (!enabled) {
      setAssistantMessage('Voice assistant is disabled. Turn it on from the POS controls to use it.');
      setStatus('idle');
      return;
    }

    if (!isSupported) {
      speakAndDisplay('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.', 'warning');
      return;
    }

    if (isListening) {
      speechEngine.stopListening();
      setIsListening(false);
      setStatus('idle');
      setAssistantMessage('Voice assistant paused. Tap mic to talk.');
    } else {
      const ok = speechEngine.startListening(
        (transcriptText) => {
          handleVoiceTranscript(transcriptText);
        },
        () => {},
        () => {
          setIsListening(false);
        }
      );
      if (ok) {
        setIsListening(true);
        setStatus('listening');
        setAssistantMessage('Listening... Speak naturally (e.g. "I took 5 eggs for personal use" or "Withdraw 500 for lunch")');
      }
    }
  };

  const cancelCurrentPrompt = () => {
    setDisambiguation(null);
    setPendingConfirmation(null);
    setPendingPaymentChoice(null);
    setStockDecision(null);
    speechEngine.cancelSpeech();
    setStatus(isListening ? 'listening' : 'idle');
    setAssistantMessage('Cancelled.');
  };

  const selectDisambiguationOption = (candidate) => {
    const qty = disambiguation?.quantity || 1;
    setDisambiguation(null);
    commitAddToCart(candidate, qty);
  };

  const confirmPendingAction = () => {
    handleVoiceTranscript('confirm');
  };

  return {
    isSupported: speechEngine.isSupported && enabled,
    isListening,
    isSpeaking,
    transcript,
    assistantMessage,
    status,
    disambiguation,
    pendingConfirmation,
    pendingPaymentChoice,
    selectPaymentMethod,
    stockDecision,
    analyticsData,
    handleVoiceTranscript,
    toggleListening,
    cancelCurrentPrompt,
    selectDisambiguationOption,
    confirmPendingAction,
    enabled,
  };
}
