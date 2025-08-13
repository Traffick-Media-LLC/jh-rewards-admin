import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import useAuthUser from "@/hooks/useAuthUser";

// Multi-step onboarding form data
interface OnboardingData {
  // Step 1: Basic Info
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
  
  // Step 2: Contact Details
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  
  // Step 3: Preferences
  marketingEmails: boolean;
  smsNotifications: boolean;
}

const STEPS = [
  { id: 1, title: "Basic Info", description: "Tell us about yourself" },
  { id: 2, title: "Contact Details", description: "Where can we reach you?" },
  { id: 3, title: "Preferences", description: "Customize your experience" },
  { id: 4, title: "Welcome", description: "You're all set!" }
];


const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    firstName: "",
    lastName: "",
    email: "",
    confirmEmail: "",
    password: "",
    confirmPassword: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
    marketingEmails: true,
    smsNotifications: false
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // SEO
  useEffect(() => {
    document.title = "Join Juice Head Rewards - Create Your Account";
    
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = "Create your Juice Head Rewards account and start earning points with every purchase.";
  }, []);

  const updateFormData = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.firstName.trim() || !formData.lastName.trim() || 
            !formData.email.trim() || !formData.confirmEmail.trim() || !formData.password.trim()) {
          toast.error("Please fill in all required fields");
          return false;
        }
        if (formData.email !== formData.confirmEmail) {
          toast.error("Email addresses do not match");
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          return false;
        }
        if (formData.password.length < 6) {
          toast.error("Password must be at least 6 characters long");
          return false;
        }
        return true;
      case 2:
        if (!formData.street.trim() || !formData.city.trim() || 
            !formData.state.trim() || !formData.postalCode.trim()) {
          toast.error("Please fill in all address fields");
          return false;
        }
        return true;
      case 3:
        return true; // Preferences are optional
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };


  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        }
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast.error("An account with this email already exists. Please login instead.");
          navigate("/auth");
          return;
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      // Create complete profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: authData.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode,
          country: formData.country,
          marketing_emails: formData.marketingEmails,
          sms_notifications: formData.smsNotifications,
          points_balance: 0,
          redeemed_this_month: 0
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // Don't throw here - the user was created successfully
        // The trigger should handle basic profile creation
      }

      setCurrentStep(4);
      toast.success("Welcome to Juice Head Rewards!");

      // Redirect to main app after a moment
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 3000);

    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const progressValue = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">Join Juice Head Rewards</CardTitle>
            <CardDescription>
              {STEPS[currentStep - 1]?.description}
            </CardDescription>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep} of {STEPS.length}</span>
              <span>{STEPS[currentStep - 1]?.title}</span>
            </div>
            <Progress value={progressValue} className="w-full" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => updateFormData("firstName", e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => updateFormData("lastName", e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmEmail">Confirm Email Address *</Label>
                <Input
                  id="confirmEmail"
                  type="email"
                  value={formData.confirmEmail}
                  onChange={(e) => updateFormData("confirmEmail", e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
                  placeholder="Create a strong password"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Contact Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => updateFormData("street", e.target.value)}
                  placeholder="123 Main Street"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData("city", e.target.value)}
                    placeholder="New York"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => updateFormData("state", e.target.value)}
                    placeholder="NY"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code *</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => updateFormData("postalCode", e.target.value)}
                    placeholder="10001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => updateFormData("country", e.target.value)}
                    placeholder="United States"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Communication Preferences</h3>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="marketingEmails"
                    checked={formData.marketingEmails}
                    onCheckedChange={(checked) => updateFormData("marketingEmails", Boolean(checked))}
                  />
                  <Label htmlFor="marketingEmails" className="text-sm">
                    Receive marketing emails about new products and promotions
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="smsNotifications"
                    checked={formData.smsNotifications}
                    onCheckedChange={(checked) => updateFormData("smsNotifications", Boolean(checked))}
                  />
                  <Label htmlFor="smsNotifications" className="text-sm">
                    Receive SMS notifications about rewards and exclusive offers
                  </Label>
                </div>
              </div>
              
            </div>
          )}

          {/* Step 4: Welcome */}
          {currentStep === 4 && (
            <div className="text-center space-y-4 py-8">
              <div className="text-6xl">🎉</div>
              <h3 className="text-2xl font-bold text-primary">Welcome to Juice Head Rewards!</h3>
              <p className="text-muted-foreground">
                Your account has been created successfully. You'll be redirected to your dashboard shortly.
              </p>
              <div className="text-sm text-muted-foreground">
                Start earning points with every purchase and unlock exclusive rewards!
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep < 4 && (
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < 3 ? (
                <Button onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;