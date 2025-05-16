document.addEventListener('DOMContentLoaded', async function () {
  const GIFT_COLLECTION_URL = '/collections/free-gift-promo/products.json';
  const PROMO_RULES = {
    PLAZH25: 3500,
  };

  try {
    const cart = await fetch('/cart.js').then((res) => res.json());
    const subtotal = cart.items_subtotal_price / 100;
    const promoCode = cart.attributes?.promo_code?.trim();
    const requiredThreshold = PROMO_RULES[promoCode];

    // ✅ New: Clear promo code if cart is empty
    if (cart.items.length === 0 && promoCode) {
      console.log('Cart is empty. Clearing promo code.');
      await fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes: { promo_code: '' } }),
      });
      return;
    }

    if (!promoCode || !requiredThreshold) return;

    const giftProducts = await fetch(GIFT_COLLECTION_URL).then((res) => res.json());
    if (!giftProducts || giftProducts.products.length === 0) return;

    const giftProduct = giftProducts.products[0];
    const giftVariantId = giftProduct.variants[0].id;
    const giftAlreadyInCart = cart.items.some((item) => item.variant_id === giftVariantId);

    if (subtotal >= requiredThreshold && !giftAlreadyInCart) {
      await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: giftVariantId, quantity: 1 }),
      });
      window.location.href = `/discount/${encodeURIComponent(promoCode)}?redirect=/cart`;
      return;
    }

    if ((subtotal < requiredThreshold || !PROMO_RULES[promoCode]) && giftAlreadyInCart) {
      const giftItem = cart.items.find((item) => item.variant_id === giftVariantId);
      await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: giftItem.key, quantity: 0 }),
      });
      location.reload();
    }
  } catch (err) {
    console.error('Gift promo logic failed:', err);
  }
});
