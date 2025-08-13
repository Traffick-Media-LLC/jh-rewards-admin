import React from "react";
import { useCart } from "@/contexts/CartContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatPoints } from "@/lib/pricing";

const Points: React.FC<{ value: number }> = ({ value }) => (
  <span className="font-medium">{value.toLocaleString()} Points</span>
);

export const CartSheet: React.FC = () => {
  const isMobile = useIsMobile();
  const { isOpen, closeCart, items, subtotalPoints, updateQty, removeItem } = useCart();

  const Content = (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <p>Your cart is empty.</p>
            <div className="mt-4">
              <Button asChild onClick={closeCart}>
                <Link to="/shop">Shop Rewards</Link>
              </Button>
            </div>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.productId} className="p-4 flex gap-4">
                <img src={item.image} alt={`${item.name} thumbnail`} className="w-16 h-16 object-contain bg-card rounded" />
                <div className="flex-1">
                  <Link to={`/product/${item.productId}`} className="text-sm font-medium hover:underline" onClick={closeCart}>
                    {item.name}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-1">{formatPoints(item.pricePoints)}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button variant="secondary" size="sm" aria-label={`Decrease ${item.name} quantity`} onClick={() => updateQty(item.productId, item.qty - 1, item.variantId)}>−</Button>
                    <div className="px-2 min-w-8 text-center text-sm select-none">{item.qty}</div>
                    <Button variant="secondary" size="sm" aria-label={`Increase ${item.name} quantity`} onClick={() => updateQty(item.productId, item.qty + 1, item.variantId)}>+</Button>
                    <Button variant="ghost" size="sm" className="ml-2" onClick={() => removeItem(item.productId, item.variantId)} aria-label={`Remove ${item.name} from cart`}>
                      Remove
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-foreground self-start">
                  <Points value={item.pricePoints * item.qty} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="border-t p-4 bg-background mt-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-muted-foreground">Subtotal</div>
          <div className="text-base font-semibold"><Points value={subtotalPoints} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.length === 0 ? (
            <Button className="flex-1" aria-label="Proceed to checkout" disabled>
              Checkout
            </Button>
          ) : (
            <Button asChild className="flex-1" aria-label="Proceed to checkout">
              <Link to="/checkout" onClick={closeCart}>Checkout</Link>
            </Button>
          )}
          <Button variant="secondary" className="flex-1" onClick={closeCart} aria-label="Continue shopping">
            Continue shopping
          </Button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(o) => (o ? undefined : closeCart())}>
        <DrawerContent className="h-[50vh]">
          <DrawerHeader>
            <DrawerTitle>Your Cart</DrawerTitle>
            <DrawerDescription>Review your items and redeem when ready.</DrawerDescription>
          </DrawerHeader>
          {Content}
          <DrawerFooter />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(o) => (o ? undefined : closeCart())}>
      <SheetContent side="right" className="w-full sm:max-w-md h-[50vh] bottom-auto flex flex-col overflow-hidden">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
          <SheetDescription>Review your items and redeem when ready.</SheetDescription>
        </SheetHeader>
        {Content}
        <SheetFooter>
          <SheetClose asChild>
            <span />
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;
