import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link, useLocation } from "react-router-dom";
import { PRODUCTS, Product, Category } from "@/data/products";
import { formatPoints } from "@/lib/pricing";
import { useCart } from "@/contexts/CartContext";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import useProfile from "@/hooks/useProfile";
const Index = () => {
  const {
    profile
  } = useProfile();
  const queryClient = useQueryClient();
  const userPoints = profile?.points_balance ?? 0;
  const [rewardsCode, setRewardsCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [validationSuccess, setValidationSuccess] = useState(false);
  const {
    toast
  } = useToast();
  const {
    addItem,
    openCart
  } = useCart();
  const location = useLocation();

  // Auto-fill rewards code from ?code= query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeParam = params.get("code");
    if (codeParam) {
      setRewardsCode(codeParam);
    }
  }, [location.search]);
  const handleSubmitCode = async () => {
    if (!rewardsCode.trim()) {
      setValidationMessage("Please enter a rewards code");
      setValidationSuccess(false);
      return;
    }
    setIsSubmitting(true);
    setValidationMessage("");
    try {
      console.log('Submitting rewards code:', rewardsCode);

      // Collect client info for the API
      const clientInfo = {
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        referrer: document.referrer || 'direct',
        screen_resolution: `${screen.width}x${screen.height}`,
        language: navigator.language
      };
      const {
        data,
        error
      } = await supabase.functions.invoke('validate-rewards-code', {
        body: {
          code: rewardsCode.trim(),
          clientInfo: clientInfo
        }
      });
      if (error) {
        throw new Error(error.message);
      }
      console.log('Validation response:', data);

      // Check if the edge function call was successful and parse the actual validation result
      if (data && data.data && data.data.valid) {
        setValidationMessage("Your rewards code has been validated successfully!");
        setValidationSuccess(true);

        // Refresh profile to reflect updated points
        await queryClient.invalidateQueries({
          queryKey: ['profile']
        });
        setRewardsCode("");
      } else {
        // Check for specific error messages
        if (data?.error && data.error.includes('already been redeemed')) {
          setValidationMessage("Code has already been redeemed");
        } else if (data?.error) {
          // Use the specific error message from the backend
          setValidationMessage(data.error);
        } else {
          // Generic invalid code message
          setValidationMessage("Sorry this code is invalid");
        }
        setValidationSuccess(false);
      }
    } catch (error) {
      console.error('Error validating code:', error);

      // Check for specific monthly limit error
      if (error instanceof Error && error.message.includes('Monthly code redemption limit (60) reached')) {
        setValidationMessage("You've reached your monthly limit of 60 code redemptions. Try again next month!");
      } else {
        setValidationMessage("There was a problem validating your code. Please try again.");
      }
      setValidationSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  const rewardSteps = [{
    icon: <img src="/lovable-uploads/b058a0bc-52e6-43ab-ac05-c8b836a41a81.png" alt="Collect & Earn icon" className="w-12 h-12 object-contain" />,
    title: "COLLECT & EARN",
    description: "Scan the points or code in your products to start collecting points."
  }, {
    icon: <img src="/lovable-uploads/8ce9c75a-2ede-4ad9-bdb9-3772afac9a45.png" alt="Rack Up Points icon" className="w-12 h-12 object-contain" />,
    title: "RACK UP POINTS",
    description: "Earn XX points per code and keep an eye out for bonus opportunities."
  }, {
    icon: <img src="/lovable-uploads/019bbdac-62c9-4465-9b07-751e4ea7d49b.png" alt="Pick Rewards icon" className="w-12 h-12 object-contain" />,
    title: "PICK REWARDS",
    description: "Browse XX+ rewards and choose what you want to save up for."
  }, {
    icon: <img src="/lovable-uploads/265533f4-1b3b-4582-97c3-b460377e120a.png" alt="Redeem & Enjoy icon" className="w-12 h-12 object-contain" />,
    title: "REDEEM & ENJOY",
    description: "Use your points to claim rewards, shipped free to your door!"
  }];
  // Fetch featured products from Supabase
  const {
    data: featuredProducts = []
  } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('products').select('*').eq('active', true).eq('homepage', true).limit(8);
      if (error) throw error;
      return data.map((product) => ({
        id: product.id, // Use actual database UUID
        name: product.name,
        price: product.price_cents,
        category: product.category as Category || 'Other',
        image: product.image_url || '/placeholder.svg',
        description: product.description,
      }));
    }
  });
  return <div className="min-h-screen bg-gray-50">
      <Header />

      {/* New Hero Section with Rewards Image */}
      <div className="w-full relative md:min-h-[460px] lg:min-h-[520px] xl:min-h-[600px] md:mb-20 bg-no-repeat bg-center bg-cover md:bg-[url('/lovable-uploads/b468094c-b5e7-4ce5-afc7-bf047461dd8b.png')]">{/* Mobile hero image */}
        <div className="px-4 py-6 text-left mb-4 md:mb-0 md:absolute md:inset-0 md:left-8 md:top-1/2 md:transform md:-translate-y-1/2 md:max-w-md md:flex md:flex-col md:justify-center md:items-start">
          <h1 className="text-3xl sm:text-4xl mb-4 drop-shadow-lg text-foreground font-bold text-left md:text-4xl">
            Redeem Points for Rewards
          </h1>
          <p className="text-base sm:text-lg text-foreground drop-shadow-md text-left">
            Get Started Below
          </p>
        </div>
        <img src="/lovable-uploads/cbf48e0c-0a95-423c-a534-f17722cf2f98.png" alt="Rewards hero (mobile)" className="block md:hidden w-full h-auto" loading="lazy" />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {/* Rewards Code Entry Section */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-16 md:mb-24 items-center">
          {/* Left Column - Content */}
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              REWARDS PROGRAM
            </h2>
            
            <p className="text-lg text-gray-600 mb-8 font-sans">
              Earn points effortlessly by enjoying your favorite products, 
              then redeem these points for exclusive rewards. Start earning points 
              today and turn your experience into even more of what you 
              love. The best part? It's easy, fun, and designed with you in mind.
            </p>

            <div className="max-w-md mx-auto md:mx-0">
              <p className="text-sm text-gray-600 mb-4">
                ENTER YOUR REWARDS CODE BELOW (CASE SENSITIVE)
              </p>
              <div className="flex gap-2 mb-2">
                <Input placeholder="XXXXXXXXX" value={rewardsCode} onChange={e => setRewardsCode(e.target.value)} className="flex-1 h-11 rounded-none" disabled={isSubmitting} />
                <Button onClick={handleSubmitCode} size="lg" disabled={isSubmitting}>
                  {isSubmitting ? "VALIDATING..." : "SUBMIT"}
                </Button>
              </div>
              {validationMessage && <p className={`text-sm mt-2 ${validationSuccess ? 'text-green-600' : 'text-red-600'}`}>
                  {validationMessage}
                </p>}
            </div>
          </div>

          {/* Right Column - Product Card */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm aspect-[3/2] rounded-lg p-6 flex justify-center items-center" style={{
            backgroundColor: '#D9D9D9'
          }}>
              <img src="/lovable-uploads/51a4a4a7-762a-49af-a9db-f4feb1426cf9.png" alt="Juice Head Products" className="max-w-full h-auto object-contain" />
            </div>
          </div>
        </div>

        {/* How Rewards Work */}
        <section className="mb-16 md:mb-24">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-6 md:mb-8">
            HOW REWARDS WORKS
          </h2>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {rewardSteps.map((step, index) => <Card key={index} className="text-center border-none shadow-none">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-gray-900 mb-3 font-bold text-2xl">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </CardContent>
              </Card>)}
          </div>
        </section>

        {/* Your Points Section */}
        <section className="mb-20 md:mb-28">
          <div className="bg-white rounded-lg p-6 md:p-8 shadow-sm">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">YOUR POINTS</h2>
                <p className="text-gray-600 mb-6 font-sans">
                  See just how close you are to unlocking something amazing. Every point you 
                  earn brings you closer to exclusive perks, premium items, and special treats 
                  designed just for fans like you. Feeling ready to redeem? Explore 
                  our rewards and turn your points into something unforgettable. The best part? 
                  It's all just a few clicks away!
                </p>
                <p className="text-sm text-gray-600 mb-4 font-sans">
                  View full reward points history in your account.
                </p>
                <Button asChild>
                  <Link to="/account" aria-label="Go to My Account">MY ACCOUNT</Link>
                </Button>
              </div>
              <div className="flex justify-center">
                <div className="relative w-56 h-56">
                  <img src="/lovable-uploads/8bb2554d-df95-48af-b54f-5c8e92320039.png" alt="Rewards points badge background" loading="lazy" className="absolute inset-0 w-full h-full object-contain" />
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center drop-shadow">
                      <div className="text-4xl font-bold">{userPoints}</div>
                      <div className="text-lg">POINTS</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Shop Rewards */}
        <section className="text-center mb-16 md:mb-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">SHOP REWARDS</h2>
          <p className="text-gray-600 mb-4 font-sans">
            Shop a collection of top-tier vape gear, exclusive swag, gift cards, and more.
          </p>
          <p className="text-gray-600 mb-6 md:mb-8 font-sans">
            Rack up points and score the rewards you've been waiting for!
          </p>

          {featuredProducts.length > 0 ? <div className="mt-6 md:mt-8 grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredProducts.map(p => <Card key={p.id} className="overflow-hidden group hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
                  <CardContent className="p-0">
                    <Link to={`/product/${p.id}`} aria-label={`View ${p.name}`}>
                      <div className="aspect-[4/3] w-full bg-card border-b">
                        <img src={p.image} alt={`${p.name} product image`} loading="lazy" className="w-full h-full object-contain p-4" />
                      </div>
                    </Link>
                  </CardContent>
                  <div className="flex flex-col flex-1">
                    <CardHeader className="p-4 pb-2 flex-1">
                      <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                        <Link to={`/product/${p.id}`} className="hover:underline group-hover:text-primary transition-colors">{p.name}</Link>
                      </h3>
                    </CardHeader>
                    <CardFooter className="flex items-center justify-between p-4 pt-2">
                      <span className="text-sm text-foreground font-medium">{formatPoints(p.price)}</span>
                      <Button size="sm" variant="secondary" aria-label={`Add ${p.name} to cart`} onClick={() => {
                        addItem(p, 1);
                        openCart();
                      }}>
                        Add to Cart
                      </Button>
                    </CardFooter>
                  </div>
                </Card>)}
            </div> : <p className="text-muted-foreground mt-6">No homepage products yet.</p>}

          <div className="mt-6 md:mt-8">
            <Button size="lg" asChild>
              <Link to="/shop">View All Products</Link>
            </Button>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="mb-20 md:mb-28" aria-label="Product categories">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-center">
            <div className="text-center">
              <img src="/lovable-uploads/f65156fb-b5c8-4be8-9219-bb594e8f65eb.png" alt="Juice Head Pouches product category" loading="lazy" className="w-full max-w-sm mx-auto rounded-xl shadow-sm" />
              <Button className="mt-4 bg-foreground text-background hover:bg-foreground/90" asChild>
                <Link to="/shop" aria-label="Learn more about Pouches">Learn More</Link>
              </Button>
            </div>
            <div className="text-center">
              <img src="/lovable-uploads/427ae857-5ebc-4643-b323-7c4cb576bf99.png" alt="Juice Head E-Liquids product category" loading="lazy" className="w-full max-w-sm mx-auto rounded-xl shadow-sm" />
              <Button className="mt-4 bg-foreground text-background hover:bg-foreground/90" asChild>
                <Link to="/shop" aria-label="Learn more about E-Liquids">Learn More</Link>
              </Button>
            </div>
            <div className="text-center">
              <img src="/lovable-uploads/eaa458de-74de-49ae-a0a2-b3373c8e03d0.png" alt="Juice Head Salts product category" loading="lazy" className="w-full max-w-sm mx-auto rounded-xl shadow-sm" />
              <Button className="mt-4 bg-foreground text-background hover:bg-foreground/90" asChild>
                <Link to="/shop" aria-label="Learn more about Salts">Learn More</Link>
              </Button>
            </div>
            <div className="text-center">
              <img src="/lovable-uploads/06a3677e-b059-4811-b010-76076d6832e3.png" alt="Juice Head Disposables product category" loading="lazy" className="w-full max-w-sm mx-auto rounded-xl shadow-sm" />
              <Button className="mt-4 bg-foreground text-background hover:bg-foreground/90" asChild>
                <Link to="/shop" aria-label="Learn more about Disposables">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Product Showcase */}
        
      </main>

      {/* Footer */}
      <Footer />
    </div>;
};
export default Index;