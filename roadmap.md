# Roadmap
- [x] Home page polish (phone top bar, sign-in button, "Connects with" strip)
- [x] Dashboard polish (side menu folds on phones, stacked header)
- [x] Google basics (title, description, sitemap, robots, site info)
- [ ] More networks: real Impact / Amazon connections — waiting on user to pick which first and have API access

## Payment verification
- [x] Confirm payment before showing Pro success; retry every 3 seconds for up to 30 seconds.
- [ ] Add customer.subscription.deleted to the existing test webhook — requires owner approval.
- [x] Complete one preview test-card checkout and verify webhook upgrades the profile to pro; success appears only after subscription verification.
- [ ] Cancel that test subscription and verify webhook returns the profile to free — blocked until owner approves the missing cancellation event.

## Before launch
- [ ] Owner switches Stripe keys in secure settings and configures the Pro price for LIVE mode.
- [ ] Re-create the webhook in live mode with checkout.session.completed, customer.subscription.updated, and customer.subscription.deleted.
- [ ] Complete one live purchase, verify Pro activation, then refund the purchase.
- [ ] Publish only with explicit owner approval after launch checks pass.
