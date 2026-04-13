import { Suspense } from "react";
import PaymentPageContent from "./PaymentPageContent";

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500">Loading payment details...</p>
        </div>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}