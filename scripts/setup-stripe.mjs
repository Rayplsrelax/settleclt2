/**
 * Stripe Setup Script for Settle CLT
 * Creates products, prices, billing portal config, and updates webhook endpoint.
 * Run: node scripts/setup-stripe.mjs
 */
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const TIERS = {
  featured: {
    name: "Settle CLT - Featured Listing",
    description:
      "Stand out with a Featured badge, priority placement, photo gallery (up to 5), and detailed click analytics.",
    monthlyPrice: 2900, // $29/mo
  },
  premium: {
    name: "Settle CLT - Premium Listing",
    description:
      "Maximum visibility with Premium badge, top of search results, expanded photo gallery (up to 15), lead generation analytics, and monthly performance reports.",
    monthlyPrice: 7900, // $79/mo
  },
};

async function setupProducts() {
  console.log("\n=== Setting up Stripe Products & Prices ===\n");

  for (const [tier, config] of Object.entries(TIERS)) {
    // Check if product already exists
    const existing = await stripe.products.search({
      query: `metadata["settle_tier"]:"${tier}"`,
    });

    let product;
    if (existing.data.length > 0) {
      product = existing.data[0];
      console.log(`✓ Product "${config.name}" already exists: ${product.id}`);
    } else {
      product = await stripe.products.create({
        name: config.name,
        description: config.description,
        metadata: { settle_tier: tier },
      });
      console.log(`✓ Created product "${config.name}": ${product.id}`);
    }

    // Check if price exists
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      type: "recurring",
      limit: 5,
    });

    const matchingPrice = prices.data.find(
      (p) => p.unit_amount === config.monthlyPrice
    );
    if (matchingPrice) {
      console.log(
        `  ✓ Price $${config.monthlyPrice / 100}/mo already exists: ${matchingPrice.id}`
      );
    } else {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: config.monthlyPrice,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { settle_tier: tier },
      });
      console.log(
        `  ✓ Created price $${config.monthlyPrice / 100}/mo: ${price.id}`
      );
    }
  }
}

async function setupBillingPortal() {
  console.log("\n=== Setting up Billing Portal ===\n");

  const configs = await stripe.billingPortal.configurations.list({ limit: 1 });

  if (configs.data.length > 0 && configs.data[0].active) {
    console.log(
      `✓ Billing portal already configured: ${configs.data[0].id}`
    );
    return;
  }

  // Get all active prices for our products to configure subscription updates
  const allProducts = await stripe.products.search({
    query: 'metadata["settle_tier"]:"featured" OR metadata["settle_tier"]:"premium"',
  });
  
  const productPrices = [];
  for (const product of allProducts.data) {
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      type: "recurring",
      limit: 5,
    });
    if (prices.data.length > 0) {
      productPrices.push({
        product: product.id,
        prices: prices.data.map((p) => p.id),
      });
    }
  }

  const config = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: "Manage your Settle CLT subscription",
    },
    features: {
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        cancellation_reason: {
          enabled: true,
          options: [
            "too_expensive",
            "missing_features",
            "switched_service",
            "unused",
            "other",
          ],
        },
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        proration_behavior: "create_prorations",
        products: productPrices,
      },
      payment_method_update: {
        enabled: true,
      },
      invoice_history: {
        enabled: true,
      },
    },
  });

  console.log(`✓ Created billing portal configuration: ${config.id}`);
}

async function setupWebhook() {
  console.log("\n=== Setting up Webhook Endpoint ===\n");

  const productionUrl = "https://settleclt.com/api/stripe/webhook";
  const requiredEvents = [
    "checkout.session.completed",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.payment_succeeded",
    "invoice.payment_failed",
    "customer.subscription.trial_will_end",
  ];

  // List existing webhooks
  const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });

  // Check if production webhook already exists
  const existingProd = webhooks.data.find((w) =>
    w.url === productionUrl
  );

  if (existingProd) {
    // Update events if needed
    await stripe.webhookEndpoints.update(existingProd.id, {
      enabled_events: requiredEvents,
    });
    console.log(`✓ Production webhook already exists: ${existingProd.id}`);
    console.log(`  URL: ${productionUrl}`);
    console.log(`  Events: ${requiredEvents.length} event types`);
    return;
  }

  // Create production webhook
  const webhook = await stripe.webhookEndpoints.create({
    url: productionUrl,
    enabled_events: requiredEvents,
    description: "Settle CLT production webhook",
  });

  console.log(`✓ Created production webhook: ${webhook.id}`);
  console.log(`  URL: ${productionUrl}`);
  console.log(`  Events: ${requiredEvents.length} event types`);
  console.log(
    `\n⚠️  IMPORTANT: Update STRIPE_WEBHOOK_SECRET with the new webhook signing secret from Stripe Dashboard.`
  );
  console.log(`  The webhook secret is shown once at creation time in the Stripe Dashboard.`);
}

async function main() {
  console.log("🔧 Settle CLT — Stripe Setup\n");
  console.log(
    `Using Stripe key: ${process.env.STRIPE_SECRET_KEY?.substring(0, 12)}...`
  );

  await setupProducts();
  await setupBillingPortal();
  await setupWebhook();

  console.log("\n✅ Stripe setup complete!\n");
}

main().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
