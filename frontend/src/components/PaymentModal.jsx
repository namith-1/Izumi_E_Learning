import React, { useState } from "react";
import { Check, Loader2, X } from "lucide-react";

const PaymentModal = ({
  course,
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  paymentState = "idle",
}) => {
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [termsAccepted, setTermsAccepted] = useState(false);

  if (!isOpen) return null;

  const isSuccess = paymentState === "success";

  return (
    <div>
      <style>{`
        .payment-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .payment-modal-container {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          max-width: 420px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease-in-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .payment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .payment-header-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .payment-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          color: #64748b;
          transition: color 0.2s;
        }

        .payment-close-btn:hover {
          color: #0f172a;
        }

        .course-summary-card {
          background: #f8fafc;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          border: 1px solid #e2e8f0;
        }

        .course-title {
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
        }

        .course-instructor {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0 0 1rem 0;
        }

        .course-price-display {
          font-size: 1.5rem;
          font-weight: 800;
          color: #059669;
          margin: 0;
        }

        .payment-methods {
          margin-bottom: 1.5rem;
        }

        .payment-methods-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #0f172a;
          display: block;
          margin-bottom: 0.75rem;
        }

        .method-option {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .method-option:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }

        .method-option.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .method-radio {
          width: 18px;
          height: 18px;
          border: 2px solid #cbd5e1;
          border-radius: 50%;
          margin-right: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          cursor: pointer;
        }

        .method-option.selected .method-radio {
          border-color: #3b82f6;
          background: #3b82f6;
        }

        .method-radio::after {
          content: "";
          display: none;
        }

        .method-option.selected .method-radio::after {
          content: "";
          display: block;
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
        }

        .method-label {
          font-size: 0.95rem;
          font-weight: 500;
          color: #0f172a;
          cursor: pointer;
        }

        .terms-section {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #fef3c7;
          border-radius: 8px;
          border-left: 4px solid #f59e0b;
        }

        .terms-checkbox-container {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .terms-checkbox {
          width: 20px;
          height: 20px;
          margin-top: 2px;
          cursor: pointer;
          accent-color: #3b82f6;
        }

        .terms-label {
          font-size: 0.875rem;
          color: #0f172a;
          cursor: pointer;
          line-height: 1.4;
        }

        .info-message {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.5rem;
          font-style: italic;
        }

        .info-box {
          background: #e0f2fe;
          border-left: 4px solid #0284c7;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
        }

        .info-box-text {
          font-size: 0.875rem;
          color: #0369a1;
          margin: 0;
        }

        .payment-actions {
          display: flex;
          gap: 1rem;
        }

        .btn-cancel {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          background: white;
          color: #64748b;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
        }

        .btn-cancel:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
          color: #0f172a;
        }

        .btn-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-confirm {
          flex: 1;
          padding: 0.75rem;
          border: none;
          background: #10b981;
          color: white;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.95rem;
        }

        .btn-confirm:hover:not(:disabled) {
          background: #059669;
        }

        .btn-confirm:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <div
        className="payment-modal-overlay"
        onClick={() => {
          if (!isProcessing && !isSuccess) {
            onClose();
          }
        }}
      >
        <div
          className="payment-modal-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="payment-header">
            <h2 className="payment-header-title">Complete Enrollment</h2>
            <button
              className="payment-close-btn"
              onClick={onClose}
              disabled={isProcessing || isSuccess}
            >
              <X size={24} />
            </button>
          </div>

          {/* Course Summary */}
          {course && (
            <div className="course-summary-card">
              <h3 className="course-title">{course.title}</h3>
              <p className="course-instructor">
                by {course.instructorName || "Instructor"}
              </p>
              <p className="course-price-display">
                ${(course.price || 0).toFixed(2)}
              </p>
            </div>
          )}

          {/* Info Message */}
          <div className="info-box">
            <p className="info-box-text">
              {isSuccess
                ? "Payment confirmed. Loading your course access now..."
                : "💡 No actual payment gateway is implemented yet"}
            </p>
          </div>

          {/* Payment Methods */}
          <div className="payment-methods">
            <label className="payment-methods-label">Payment Method</label>

            <div
              className={`method-option ${selectedMethod === "card" ? "selected" : ""}`}
              onClick={() => setSelectedMethod("card")}
            >
              <div className="method-radio" />
              <span className="method-label">Credit / Debit Card</span>
            </div>

            <div
              className={`method-option ${selectedMethod === "wallet" ? "selected" : ""}`}
              onClick={() => setSelectedMethod("wallet")}
            >
              <div className="method-radio" />
              <span className="method-label">Digital Wallet</span>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="terms-section">
            <div className="terms-checkbox-container">
              <input
                type="checkbox"
                className="terms-checkbox"
                id="terms-check"
                name="termsAccepted"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <label htmlFor="terms-check" className="terms-label">
                I agree to the Terms & Conditions and understand that this is a
                learning platform enrollment.
              </label>
            </div>
            <p className="info-message">
              Automatic enrollment upon confirmation
            </p>
          </div>

          {/* Action Buttons */}
          <div className="payment-actions">
            <button
              className="btn-cancel"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              className="btn-confirm"
              onClick={onConfirm}
              disabled={!termsAccepted || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processing...
                </>
              ) : isSuccess ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Finalizing...
                </>
              ) : (
                <>
                  <Check size={16} /> Complete Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
