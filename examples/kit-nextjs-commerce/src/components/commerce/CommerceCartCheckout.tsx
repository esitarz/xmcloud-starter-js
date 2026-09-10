'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { CommerceCart } from '@/lib/commerce/cart/types';

const ensureShopperSession = async (): Promise<Response> => {
  let cartResponse = await fetch('/api/commerce/cart');
  if (cartResponse.status === 401) {
    const anonymousResponse = await fetch('/api/commerce/auth/anonymous', { method: 'POST' });
    if (!anonymousResponse.ok) throw new Error('Unable to start a shopper session');
    cartResponse = await fetch('/api/commerce/cart');
  }
  return cartResponse;
};

export const CommerceCartCheckout = () => {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CommerceCart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const loadCart = useCallback(async () => {
    try {
      const response = await ensureShopperSession();
      const payload = (await response.json()) as CommerceCart & { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to load cart');
      setCart(payload);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load cart');
    }
  }, []);

  useEffect(() => {
    void loadCart();
  }, [loadCart, open]);

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const startCheckout = async () => {
    setCheckingOut(true);
    setError(null);
    try {
      const response = await fetch('/api/commerce/checkout/connect/start', { method: 'POST' });
      const payload = (await response.json()) as { redirectUrl?: string; error?: string };
      if (!response.ok || !payload.redirectUrl) {
        throw new Error(payload.error || 'Unable to start checkout');
      }
      window.location.href = payload.redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start checkout');
      setCheckingOut(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Open cart">
          <ShoppingCart className="size-5" />
          {itemCount > 0 && (
            <span className="bg-primary text-primary-foreground absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
              {itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Cart</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 py-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!cart?.items.length && (
            <p className="text-muted-foreground text-sm">Cart is empty. Add a product to check out.</p>
          )}
          {cart?.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-muted-foreground">Qty {item.quantity}</p>
              </div>
              {item.unitPrice !== undefined && (
                <p>{item.unitPrice.toLocaleString('en-US', { style: 'currency', currency: cart.currency || 'USD' })}</p>
              )}
            </div>
          ))}
        </div>
        <Button onClick={startCheckout} disabled={!cart?.items.length || checkingOut}>
          {checkingOut ? 'Redirecting to Stripe…' : 'Checkout with Stripe'}
        </Button>
        <p className="text-muted-foreground text-xs">
          Test card 4242 4242 4242 4242. Charge lands on the connected merchant account.
        </p>
      </SheetContent>
    </Sheet>
  );
};
