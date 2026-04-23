// Legacy filename kept intentionally to match existing architecture docs.
// The app now uses Stripe Payment Links directly.
export function getHostedCheckoutLink() {
  return process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;
}
