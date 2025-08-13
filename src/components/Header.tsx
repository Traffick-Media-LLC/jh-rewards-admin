import React from "react";
import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import useIsAdmin from "@/hooks/useIsAdmin";

const Header: React.FC = () => {
  const { openCart, totalItems } = useCart();
  const { isAdmin } = useIsAdmin();
  return (
    <header className="bg-header shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-gradient-to-b after:from-black/5 after:to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-24 lg:h-32">
          <div className="flex-1 flex items-center">
            {/* Mobile menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    aria-label="Open navigation menu"
                    className="p-2 rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Menu className="w-6 h-6" aria-hidden="true" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <nav className="mt-4" aria-label="Mobile Primary">
                    <ul className="space-y-2">
                      <li>
                        <SheetClose asChild>
                          <NavLink to="/" className="block px-2 py-2 text-base text-foreground hover:underline">Home</NavLink>
                        </SheetClose>
                      </li>
                      <li>
                        <SheetClose asChild>
                          <NavLink to="/shop" className="block px-2 py-2 text-base text-foreground hover:underline">Shop</NavLink>
                        </SheetClose>
                      </li>
                      <li>
                        <SheetClose asChild>
                          <NavLink to="/account" className="block px-2 py-2 text-base text-foreground hover:underline">Account</NavLink>
                        </SheetClose>
                      </li>
                      {isAdmin && (
                        <li>
                          <SheetClose asChild>
                            <NavLink to="/admin" className="block px-2 py-2 text-base text-foreground hover:underline">Admin</NavLink>
                          </SheetClose>
                        </li>
                      )}
                    </ul>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            <nav className="hidden md:block" aria-label="Primary">
              <ul className="flex items-center gap-4 lg:gap-6">
                <li><NavLink to="/" className="text-sm text-muted-foreground hover:text-foreground">Home</NavLink></li>
                <li><NavLink to="/shop" className="text-sm text-muted-foreground hover:text-foreground">Shop</NavLink></li>
                {/* Admin link (desktop) */}
                {/** Admin link added conditionally below in the right section to keep layout consistent */}
              </ul>
            </nav>
          </div>

          {/* Logo */}
          <div className="flex justify-center">
            <img src="/lovable-uploads/a49822c7-f807-4afd-a720-ff758023dccb.png" alt="Juice Head Rewards logo" className="h-10 md:h-16 lg:h-24" />
          </div>

          <div className="flex-1 flex justify-end items-center gap-4 md:gap-6">
            {/* Desktop Admin link */}
            {isAdmin && (
              <NavLink to="/admin" className="text-sm text-muted-foreground hover:text-foreground hidden md:block">Admin</NavLink>
            )}
            <NavLink to="/account" className="flex flex-col items-center">
              <img src="/lovable-uploads/5d61ca7e-866f-4366-bf94-13fdfa58bea5.png" alt="Account" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
              <span className="mt-1 text-[10px] md:text-xs text-muted-foreground hidden sm:block">ACCOUNT</span>
            </NavLink>
            <div className="relative flex flex-col items-center">
              <button type="button" onClick={openCart} aria-label="Open cart" className="focus:outline-none p-1 md:p-0">
                <img src="/lovable-uploads/7eea57eb-06f9-499f-9552-46a5f4ad72ab.png" alt="Cart" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
              </button>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-foreground text-background text-[10px] leading-none px-1.5 py-0.5 rounded-full">
                  {totalItems}
                </span>
              )}
              <span className="mt-1 text-[10px] md:text-xs text-muted-foreground hidden sm:block">Cart</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
