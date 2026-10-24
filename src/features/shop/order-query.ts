/**
 * Order ids arrive from provider redirects in a few awkward shapes:
 *
 *   /shop/pay/return?order=<id>
 *   /shop/pay/return?order=<id>?paymentReference=<ref>   (Monnify appends '?')
 *   /shop/orders/<id>%3FpaymentReference%3D<ref>         (that query encoded into the path)
 *
 * Splits the id back out so it stays usable, and recovers the payment reference
 * that travelled with it.
 */
export function parseOrderParam(raw?: string | null): {
  orderId?: string;
  paymentReference?: string;
} {
  if (!raw) {
    return {};
  }

  // A path param may still carry the query percent-encoded.
  const value = /%3f/i.test(raw) ? decodeURIComponent(raw) : raw;
  const [id, ...rest] = value.split('?');
  const params = new URLSearchParams(rest.join('?'));

  return {
    orderId: id || undefined,
    paymentReference:
      params.get('paymentReference') ??
      params.get('trxref') ??
      params.get('reference') ??
      undefined,
  };
}
