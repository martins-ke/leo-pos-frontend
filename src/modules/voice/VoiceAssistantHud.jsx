import { useState } from 'react';
import {
  MdMic,
  MdMicOff,
  MdCheckCircle,
  MdCancel,
  MdVolumeUp,
  MdHelpOutline,
  MdClose,
  MdKeyboardArrowUp,
  MdKeyboardArrowDown,
  MdUndo,
  MdAttachMoney,
  MdPersonAdd,
  MdTrendingUp,
  MdPayments,
  MdPhoneIphone,
  MdCreditCard
} from 'react-icons/md';
import styles from './VoiceAssistantHud.module.css';

/**
 * Decoupled Pro Voice & AI Assistant HUD Component.
 * Receives the voice state and actions from useVoiceAssistant.
 */
export default function VoiceAssistantHud({ voice }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const {
    isSupported,
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
    toggleListening,
    cancelCurrentPrompt,
    selectDisambiguationOption,
    confirmPendingAction,
  } = voice;

  if (!isSupported) {
    return (
      <div className={styles.unsupportedBadge}>
        <MdMicOff size={16} /> Voice control requires Google Chrome or Microsoft Edge.
      </div>
    );
  }

  return (
    <div className={`${styles.voiceHud} ${isMinimized ? styles.minimized : ''}`}>
      {/* Floating Header / Control Strip */}
      <div className={styles.hudHeader}>
        <button
          type="button"
          onClick={toggleListening}
          className={`${styles.micButton} ${isListening ? styles.micActive : ''}`}
          title={isListening ? 'Click to pause voice assistant' : 'Click to start voice control'}
          aria-label="Voice control toggle"
        >
          {isListening ? (
            <span className={styles.pulseContainer}>
              <span className={styles.pulseRing} />
              <MdMic size={20} />
            </span>
          ) : (
            <MdMicOff size={18} />
          )}
          <span className={styles.micLabel}>
            {isListening ? 'Shop AI Live' : 'Voice Assistant Off'}
          </span>
        </button>

        <div className={styles.headerRight}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setShowHelp(!showHelp)}
            title="Voice Commands Guide"
          >
            <MdHelpOutline size={16} />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand voice controls' : 'Minimize voice HUD'}
          >
            {isMinimized ? <MdKeyboardArrowUp size={18} /> : <MdKeyboardArrowDown size={18} />}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className={styles.hudBody}>
          {/* Quick Command Help Guide */}
          {showHelp && (
            <div className={styles.helpPanel}>
              <div className={styles.helpHeader}>
                <strong>Shop Voice AI Commands (Offline / Localhost)</strong>
                <button type="button" onClick={() => setShowHelp(false)} className={styles.closeHelpBtn}>
                  <MdClose size={14} />
                </button>
              </div>
              <ul className={styles.helpList}>
                <li><strong>Record Sale:</strong> &ldquo;Record sale for 2kg sugar&rdquo; or &ldquo;Add 2 milk&rdquo;</li>
                <li><strong>Personal Use / Stock:</strong> &ldquo;Deduct 5 eggs for personal use&rdquo;, &ldquo;Record 2 milk damaged&rdquo;</li>
                <li><strong>Price &amp; Stock Check:</strong> &ldquo;How much is sugar?&rdquo;, &ldquo;How many eggs in stock?&rdquo;</li>
                <li><strong>Withdraw Cash:</strong> &ldquo;Withdraw 500 for lunch&rdquo; (Requires confirmation)</li>
                <li><strong>Record Expense:</strong> &ldquo;Record expense 200 for electricity&rdquo;</li>
                <li><strong>Shop Balances:</strong> &ldquo;How much cash do we have?&rdquo; or &ldquo;Sales today&rdquo;, &ldquo;Cells today&rdquo;, &ldquo;Sells today&rdquo;</li>
                <li><strong>Product Intelligence:</strong> &ldquo;Which products sold the most?&rdquo;, &ldquo;How much stock do we have left?&rdquo;, &ldquo;Low stock alert&rdquo;</li>
                <li><strong>Outlet & Team:</strong> &ldquo;List shops&rdquo;, &ldquo;Show staff&rdquo;, &ldquo;Show customers&rdquo;, &ldquo;List expenses&rdquo;</li>
                <li><strong>Register Customer:</strong> &ldquo;Save customer John 0712345678&rdquo;</li>
                <li><strong>Undo:</strong> &ldquo;Undo&rdquo; or &ldquo;Undo that&rdquo; to rollback last action</li>
                <li><strong>Checkout:</strong> &ldquo;Pay 500 cash&rdquo;, &ldquo;Remove bread&rdquo;, &ldquo;Clear cart&rdquo;</li>
              </ul>
            </div>
          )}

          {/* Assistant Speech Message */}
          <div className={`${styles.speechBubble} ${isSpeaking ? styles.speaking : ''}`}>
            <div className={styles.bubbleIcon}>
              <MdVolumeUp size={16} />
            </div>
            <div className={styles.bubbleContent}>
              <div className={styles.assistantText}>{assistantMessage}</div>
              {transcript && (
                <div className={styles.transcriptText}>
                  Heard: &ldquo;{transcript}&rdquo;
                </div>
              )}
            </div>
          </div>

          {/* Quick Voice Intent Chips (Shows the full scope of capabilities beyond POS) */}
          <div className={styles.commandChipsRow}>
            <button
              type="button"
              className={styles.chipBtn}
              onClick={() => voice.handleVoiceTranscript && voice.handleVoiceTranscript('sales today')}
              title="Speak or click to check today's sales and revenue"
            >
              <MdTrendingUp size={13} /> Sales Today
            </button>
            <button
              type="button"
              className={styles.chipBtn}
              onClick={() => voice.handleVoiceTranscript && voice.handleVoiceTranscript('how much cash do we have')}
              title="Speak or click to check shop cash & accounts"
            >
              <MdAttachMoney size={13} /> Shop Balances
            </button>
            <button
              type="button"
              className={styles.chipBtn}
              onClick={() => voice.handleVoiceTranscript && voice.handleVoiceTranscript('deduct 5 eggs for personal use')}
              title="Speak or click to deduct stock for personal or staff use"
            >
              Personal Use (Eggs)
            </button>
            <button
              type="button"
              className={styles.chipBtn}
              onClick={() => voice.handleVoiceTranscript && voice.handleVoiceTranscript('withdraw 500 for lunch')}
              title="Speak or click to record cash drawing"
            >
              Withdraw Cash
            </button>
            <button
              type="button"
              className={styles.chipBtn}
              onClick={() => voice.handleVoiceTranscript && voice.handleVoiceTranscript('save new customer John 0712345678')}
              title="Speak or click to register a customer"
            >
              <MdPersonAdd size={13} /> Add Customer
            </button>
            <button
              type="button"
              className={styles.chipBtn}
              onClick={() => voice.handleVoiceTranscript && voice.handleVoiceTranscript('undo')}
              title="Speak or click to rollback last action"
            >
              <MdUndo size={13} /> Undo
            </button>
          </div>

          {/* Disambiguation: Multiple Product Choices */}
          {disambiguation && (
            <div className={styles.disambiguationBox}>
              <div className={styles.disambiguationHeader}>
                <span>Select the exact item:</span>
                <span className={styles.sayHint}>(Say &ldquo;Option 1&rdquo; or tap)</span>
              </div>
              <div className={styles.candidateGrid}>
                {disambiguation.candidates.map((cand, idx) => (
                  <button
                    key={cand.id}
                    type="button"
                    onClick={() => selectDisambiguationOption(cand)}
                    className={styles.candidateBtn}
                  >
                    <span className={styles.candidateBadge}>{idx + 1}</span>
                    <span className={styles.candidateName}>{cand.name}</span>
                    <span className={styles.candidatePrice}>
                      KES {parseFloat(cand.selling_price || cand.sellingPrice || 0).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={cancelCurrentPrompt}
                className={styles.cancelActionBtn}
              >
                <MdCancel size={14} /> Cancel Selection
              </button>
            </div>
          )}

          {/* Payment Method Choice (when not specified in sentence) */}
          {pendingPaymentChoice && (
            <div className={styles.disambiguationBox}>
              <div className={styles.disambiguationHeader}>
                <span>Choose Payment Method (Total: KES {pendingPaymentChoice.total.toLocaleString()}):</span>
                <span className={styles.sayHint}>(Say &ldquo;Cash&rdquo;, &ldquo;M-Pesa&rdquo;, or &ldquo;Card&rdquo;)</span>
              </div>
              <div className={styles.candidateGrid}>
                <button
                  type="button"
                  onClick={() => selectPaymentMethod('CASH')}
                  className={styles.candidateBtn}
                >
                  <MdPayments size={20} color="var(--primary)" />
                  <span className={styles.candidateName}>Cash Payment</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectPaymentMethod('MPESA')}
                  className={styles.candidateBtn}
                >
                  <MdPhoneIphone size={20} color="var(--success)" />
                  <span className={styles.candidateName}>M-Pesa</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectPaymentMethod('CARD')}
                  className={styles.candidateBtn}
                >
                  <MdCreditCard size={20} color="var(--accent-blue)" />
                  <span className={styles.candidateName}>Debit / Card</span>
                </button>
              </div>
              <button
                type="button"
                onClick={cancelCurrentPrompt}
                className={styles.cancelActionBtn}
              >
                <MdCancel size={14} /> Cancel Sale
              </button>
            </div>
          )}

          {/* Pending Confirmation Box: Rephrase and Confirm Loop */}
          {pendingConfirmation && (
            <div className={styles.confirmationBox}>
              <div className={styles.understoodHeader}>
                <span className={styles.understoodTag}>I Understood:</span>
                <span className={styles.understoodPrompt}>Is this correct? Say &ldquo;Yes&rdquo; or &ldquo;No&rdquo;</span>
              </div>

              <div className={styles.rephraseHeadline}>
                &ldquo;{pendingConfirmation.rephrase}&rdquo;
              </div>

              {pendingConfirmation.impact && (
                <div className={styles.impactSubtext}>
                  {pendingConfirmation.impact}
                </div>
              )}

              <div className={styles.actionBtnRow}>
                <button
                  type="button"
                  onClick={confirmPendingAction}
                  className={styles.confirmBtn}
                  disabled={status === 'processing'}
                >
                  <MdCheckCircle size={16} /> Yes, Confirm &amp; Commit
                </button>
                <button
                  type="button"
                  onClick={cancelCurrentPrompt}
                  className={styles.cancelBtn}
                  disabled={status === 'processing'}
                >
                  <MdCancel size={16} /> No, Cancel
                </button>
              </div>
            </div>
          )}

          {/* Stock Decision Box (Less stock in store) */}
          {stockDecision && (
            <div className={styles.stockDecisionBox}>
              <div className={styles.stockDecisionText}>
                Requested <strong>{stockDecision.requestedQty}</strong> units, but only{' '}
                <strong>{stockDecision.availableQty}</strong> remain in store.
              </div>
              <div className={styles.actionBtnRow}>
                <button
                  type="button"
                  onClick={confirmPendingAction}
                  className={styles.confirmBtn}
                >
                  <MdCheckCircle size={16} /> Add {stockDecision.availableQty} available
                </button>
                <button
                  type="button"
                  onClick={cancelCurrentPrompt}
                  className={styles.cancelBtn}
                >
                  <MdCancel size={16} /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
