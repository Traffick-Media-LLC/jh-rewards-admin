import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <img
                src="/lovable-uploads/a49822c7-f807-4afd-a720-ff758023dccb.png"
                alt="Juice Head Rewards logo"
                className="h-16 w-auto"
                loading="lazy"
              />
            </div>
            <div className="space-y-2 text-sm">
              <p>15051 Springdale St.</p>
              <p>Suite 113</p>
              <p>Huntington Beach, CA</p>
              <p>+1 (714) 823-8750</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400">Wholesale</a></li>
              <li><a href="#" className="hover:text-blue-400">Contact Us</a></li>
              <li><a href="#" className="hover:text-blue-400">Store Locator</a></li>
              <li><a href="#" className="hover:text-blue-400">Youth Prevention</a></li>
              <li><a href="#" className="hover:text-blue-400">Our Blog</a></li>
              <li><a href="#" className="hover:text-blue-400">Affiliate Program</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Products</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400">E-Liquid</a></li>
              <li><a href="#" className="hover:text-blue-400">Disposables</a></li>
              <li><a href="#" className="hover:text-blue-400">Pouches</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400">PMTA/FDA Numbers</a></li>
              <li><a href="#" className="hover:text-blue-400">GCC Certificates</a></li>
              <li><a href="#" className="hover:text-blue-400">Shipping & Returns</a></li>
              <li><a href="#" className="hover:text-blue-400">Terms of Use</a></li>
              <li><a href="#" className="hover:text-blue-400">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="text-xs leading-relaxed text-white/80">
            Copyright © 2025, Juice Head. All Rights Reserved.
          </p>
          <p className="mt-4 text-[11px] leading-relaxed text-white/70">
            Not for Sale for Minors - Products sold on this site may contain nicotine which is a highly addictive substance. California Proposition 65 - WARNING: This product can expose you to chemicals including nicotine, which is known to the State of California to cause birth defects or other reproductive harm. For more information, go to Proposition 65 Warnings Website. Products sold on this site is intended for adult smokers. You must be of legal smoking age in your territory to purchase products. Please consult your physician before use. E-Juice on our site may contain Propylene Glycol and/or Vegetable Glycerin, Nicotine and Flavorings. Our products may be poisonous if orally ingested. Products sold by Element Vape are not smoking cessation products and have not been evaluated by the Food and Drug Administration, nor are they intended to treat, prevent or cure any disease or condition. For their protection, please keep out of reach of children and pets. Read our terms and conditions page before purchasing our products. Use All Products On This Site At Your Own Risk!
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
