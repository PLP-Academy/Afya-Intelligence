import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Star,
  Crown,
  Users,
  Heart,
  ArrowRight,
  Phone,
  Clock,
  Shield,
  CheckCircle
} from 'lucide-react';

import {
  getUserProfile,
  getTierInfo,
  initiateSTKPush,
  initiateUpgradeWithPayment,
  initiateRegistrationWithPayment,
  InstasendSTKPushResponse
} from '@/lib/subscriptionService';

const Pricing = () => {
  const { user: authUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentUserTier, setCurrentUserTier] = useState<string>('community_advocate');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('KES'); // Default to KES
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('mpesa'); // Default to M-Pesa
  const [phoneNumber, setPhoneNumber] = useState(''); // For M-Pesa payments
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    data?: InstasendSTKPushResponse;
    action: 'register' | 'upgrade';
    tier?: keyof typeof pricingData;
    selectedTierInfo?: typeof pricingData[keyof typeof pricingData];
  }>({ isOpen: false, action: 'register' });

  // Currency exchange rates (base: USD)
  const exchangeRates = {
    USD: 1.0,
    KES: 150.0,
    EUR: 0.85,
    GBP: 0.75,
    CAD: 1.25,
    AUD: 1.35,
    JPY: 150.0,
  };

  // Currency symbols
  const currencySymbols = {
    USD: '$',
    KES: 'KES ',
    EUR: '€',
    GBP: '£',
    CAD: 'CAD$',
    AUD: 'AUD$',
    JPY: '¥',
  };

  // Function to convert USD price to selected currency
  const convertPrice = (usdPrice: number, currency: string) => {
    const rate = exchangeRates[currency as keyof typeof exchangeRates] || 1.0;
    return Math.round(usdPrice * rate * 100) / 100; // Round to 2 decimal places
  };

  // Function to format price display
  const formatPrice = (usdPrice: number, currency: string) => {
    if (usdPrice === 0) return 'Free';
    const converted = convertPrice(usdPrice, currency);
    const symbol = currencySymbols[currency as keyof typeof currencySymbols.valueOf];
    return `${symbol}${converted}`;
  };

  // Kenya-focused pricing data with KES prominently displayed
  const pricingData = {
    community_advocate: {
      name: 'Community Advocate',
      price: {
        usd: 0,
        kes: 0,
        equivalent: 'KES 0/month',
        note: 'Free forever'
      },
      color: 'bg-blue-500',
      icon: Users,
      tier_type: 'free' as const,
      badge: 'Free',
      features: [
        '30-day symptom history',
        'Basic AI insights',
        'Education modules',
        'Community tracking'
      ],
      limitations: ['Limited storage', 'No advanced AI']
    },
    health_champion: {
      name: 'Health Champion',
      price: {
        usd: 1.1,
        kes: 150,
        equivalent: 'KES 150/month',
        note: '~USD $1.10'
      },
      color: 'bg-green-500',
      icon: Heart,
      tier_type: 'premium' as const,
      badge: 'Popular',
      features: [
        'Unlimited symptom history',
        'Advanced AI with DialloGPT',
        'Weekly personalized reports',
        'Data export capabilities',
        'Priority support',
        'Family account sharing',
        'M-Pesa payment integration'
      ],
      limitations: []
    },
    global_advocate: {
      name: 'Global Advocate',
      price: {
        usd: 3.0,
        kes: 400,
        equivalent: 'KES 400/month',
        note: '~USD $3.00'
      },
      color: 'bg-purple-500',
      icon: Crown,
      tier_type: 'premium' as const,
      badge: 'Premium',
      features: [
        'All Health Champion features',
        'Expert consultations',
        'Research participation',
        'Advanced analytics',
        'Exclusive content',
        'Impact reports',
        'VIP customer support',
        'Family coordination tools'
      ],
      limitations: []
    }
  };

  useEffect(() => {
    loadCurrentUserTier();
  }, [authUser]);

  const loadCurrentUserTier = async () => {
    if (!authUser?.id) return;

    try {
      const profile = await getUserProfile(authUser.id);
      if (profile) {
        setCurrentUserTier(profile.tier || 'community_advocate');
      }
    } catch (error) {
      console.error('Error loading user tier:', error);
    }
  };

  const handlePaymentInitiation = (
    tier: keyof typeof pricingData,
    action: 'register' | 'upgrade'
  ) => {
    if (!authUser && action !== 'register') {
      navigate('/auth');
      return;
    }

    const tierInfo = pricingData[tier];
    setPaymentModal({
      isOpen: true,
      action: action,
      tier: tier,
      selectedTierInfo: tierInfo
    });
  };

  const handleIntaSendPayment = async () => {
    if (!paymentModal.tier || !paymentModal.selectedTierInfo || !paymentModal.action) return;

    setIsLoading(true);
    try {
      const tierInfo = paymentModal.selectedTierInfo;
      const amount = convertPrice(tierInfo.price.usd, 'KES'); // Convert to KES for IntaSend
      const tier = paymentModal.tier;
      const action = paymentModal.action;

      // Validate M-Pesa payment requires phone number
      if (selectedPaymentMethod === 'mpesa') {
        if (!phoneNumber || !phoneNumber.match(/^\+254\d{9}$/)) {
          alert('Please enter a valid M-Pesa phone number (e.g., +254712345678)');
          setIsLoading(false);
          return;
        }
      }

      console.log('Initiating IntaSend payment:', {
        tier: paymentModal.tier,
        amount,
        paymentMethod: selectedPaymentMethod,
        action: paymentModal.action,
        phoneNumber
      });

      // For M-Pesa STK Push payments
      if (selectedPaymentMethod === 'mpesa' && phoneNumber) {
        try {
          if (action === 'upgrade' && authUser) {
            // Handle user upgrade
            const result = await initiateUpgradeWithPayment(
              authUser.id,
              null, // We'll get user profile from the function
              tier as 'health_champion' | 'global_advocate',
              amount
            );

            if (result.success) {
              alert(`STK Push sent to ${phoneNumber}! Check your phone to complete the payment.`);
              setPaymentModal({ isOpen: false, action: 'register' });
              setPhoneNumber('');
              // Optionally redirect to dashboard or reload to show new status
              window.location.reload();
            } else {
              alert(`Payment failed: ${result.message}`);
            }
          } else if (action === 'register') {
            // Handle new user registration
            const userData = {
              email: 'temp@example.com', // You might want to collect this in a form
              fullName: 'New User', // You might want to collect this in a form
              phoneNumber
            };

            const result = await initiateRegistrationWithPayment(
              userData.email,
              userData.fullName,
              userData.phoneNumber,
              tier as any,
              amount
            );

            if (result.success && result.payment_data?.success) {
              alert(`Registration STK Push sent to ${phoneNumber}! Complete payment to finish registration.`);
              setPaymentModal({ isOpen: false, action: 'register' });
              setPhoneNumber('');
              // Redirect to auth page for login if registration is secondary
              navigate('/auth');
            } else {
              alert(`Registration failed: ${result.message}`);
            }
          }
        } catch (error) {
          console.error('IntaSend STK Push error:', error);
          alert('Failed to initiate payment. Please try again.');
        }
      } else {
        // Handle other payment methods (Card, Apple Pay, etc.)
        alert(`${selectedPaymentMethod.toUpperCase()} payment method selected. Redirecting to secure payment...`);
        // You can implement redirect to IntaSend hosted checkout for cards
        setPaymentModal({ isOpen: false, action: 'register' });
      }

    } catch (error) {
      console.error('Payment processing error:', error);
      alert('An error occurred while processing the payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionButton = (tier: keyof typeof pricingData) => {
    const tierInfo = pricingData[tier];
    const isCurrentTier = currentUserTier === tier;
    const isPremium = tierInfo.tier_type === 'premium';

    if (isCurrentTier) {
      return (
        <Badge variant="secondary" className="w-full justify-center py-2">
          <CheckCircle className="w-4 h-4 mr-2" />
          Current Plan
        </Badge>
      );
    }

    if (!authUser && isPremium) {
      return (
        <Button
          onClick={() => handlePaymentInitiation(tier, 'register')}
          disabled={isLoading}
          className={`w-full ${tierInfo.color} hover:opacity-90`}
        >
          {isLoading ? 'Processing...' : `Register & Pay ${tierInfo.price.usd === 0 ? 'Free' : `${formatPrice(tierInfo.price.usd, selectedCurrency)}/mo`}`}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      );
    }

    if (authUser && !isCurrentTier) {
      return (
        <Button
          onClick={() => handlePaymentInitiation(tier, 'upgrade')}
          disabled={isLoading}
          className={`w-full ${tierInfo.color} hover:opacity-90`}
        >
          {isLoading ? 'Processing...' : `Upgrade to ${tierInfo.name}`}
          <Phone className="w-4 h-4 ml-2" />
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg health-gradient flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold">Symptom Journal</h1>
                <p className="text-xs text-muted-foreground">Pricing</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
              {authUser ? (
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Sign Out
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Choose Your
            <span className="health-gradient bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              {" "}Health Journey
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Power your health insights with AI-driven analysis. Choose the plan that fits your wellness needs and start tracking smarter today.
          </p>
          {authUser && currentUserTier !== 'community_advocate' && (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Current Tier: {pricingData[currentUserTier as keyof typeof pricingData].name}</span>
            </div>
          )}
        </div>

        {/* Payment Settings Selector */}
        <div className="flex justify-center mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
            {/* Currency Selector */}
            <div className="flex items-center gap-4 bg-muted/50 rounded-lg p-4">
              <span className="text-sm font-medium">Select Currency:</span>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="KES">KES (KES)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                  <SelectItem value="AUD">AUD ($)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method Selector (only for premium tiers) */}
            {!authUser && (
              <div className="flex items-center gap-4 bg-muted/50 rounded-lg p-4">
                <span className="text-sm font-medium">Payment Method:</span>
                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Select payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="card">Credit Card</SelectItem>
                    <SelectItem value="apple_pay">Apple Pay</SelectItem>
                    <SelectItem value="google_pay">Google Pay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {Object.entries(pricingData).map(([tierKey, tier]) => {
            const Icon = tier.icon;
            const isPopular = tierKey === 'health_champion';
            const isCurrentTier = currentUserTier === tierKey;

            return (
              <Card
                key={tierKey}
                className={`relative health-card transition-all duration-300 hover:scale-105 ${
                  isPopular ? 'ring-2 ring-green-500 shadow-lg' : ''
                } ${isCurrentTier ? 'ring-2 ring-blue-500' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-500 hover:bg-green-600">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div className={`w-16 h-16 ${tier.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                  <div className="text-3xl font-bold mb-2">
                    {tier.price.usd === 0 ? (
                      <span>Free</span>
                    ) : (
                      <>
                        <span>{formatPrice(tier.price.usd, selectedCurrency)}</span>
                        <span className="text-sm font-normal text-muted-foreground">/month</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedCurrency === 'KES' ? (
                      `~${formatPrice(tier.price.usd, 'USD')}`
                    ) : (
                      `~${formatPrice(tier.price.usd, 'KES')}`
                    )}
                  </p>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-6 border-t">
                    {getActionButton(tierKey as keyof typeof pricingData)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* M-Pesa Payment Info */}
        <div className="mt-12 max-w-3xl mx-auto">
          <Alert>
            <Phone className="h-4 w-4" />
            <AlertDescription>
              <strong>M-Pesa STK Push Payment:</strong> Premium plans require immediate payment via M-Pesa.
              You'll receive a push notification on your phone after selecting a plan. Simply approve the payment to complete your subscription.
            </AlertDescription>
          </Alert>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-3">What is M-Pesa STK Push?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                STK Push is an M-Pesa feature that sends a direct payment request to your phone. When you select a premium plan, you'll receive a push notification with payment details. Simply approve with your PIN to complete the transaction.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Can I cancel my subscription?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Yes, you can cancel your subscription anytime from your profile settings. You'll continue to have access until the end of your current billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">How does AI work?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Free tier uses rule-based analysis. Premium tiers leverage Microsoft's DialogueGPT for personalized, context-aware health insights based on your symptom patterns.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Is my data secure?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Absolutely. All data is encrypted and stored securely. We never share personal information without your explicit consent and comply with healthcare data protection standards.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* IntaSend Payment Modal */}
      {paymentModal.isOpen && paymentModal.selectedTierInfo && paymentModal.tier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl border-0">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 ${paymentModal.selectedTierInfo.color} rounded-full flex items-center justify-center`}>
                    <paymentModal.selectedTierInfo.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-lg">{paymentModal.selectedTierInfo.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {paymentModal.action === 'upgrade' ? 'Upgrade' : 'Registration'} & Payment
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setPaymentModal({ isOpen: false, action: 'register' })}
                  variant="ghost"
                  size="sm"
                  className="p-1 h-8 w-8 rounded-full"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Package Details */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Package Details</h3>
                  <Badge className={`${paymentModal.selectedTierInfo.color} text-white`}>
                    {paymentModal.selectedTierInfo.badge}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span>Plan:</span>
                    <span className="font-medium">{paymentModal.selectedTierInfo.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Price:</span>
                    <span className="font-bold text-lg text-green-600">
                      {formatPrice(paymentModal.selectedTierInfo.price.usd, selectedCurrency)}/month
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Equivalent:</span>
                    {selectedCurrency === 'KES' ?
                      <span>{formatPrice(paymentModal.selectedTierInfo.price.usd, 'USD')}</span> :
                      <span>{formatPrice(paymentModal.selectedTierInfo.price.usd, 'KES')}</span>
                    }
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t">
                  <p className="text-sm font-medium mb-2">Features Included:</p>
                  <ul className="space-y-1">
                    {paymentModal.selectedTierInfo.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-xs">
                        <Check className="w-3 h-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                    {paymentModal.selectedTierInfo.features.length > 3 && (
                      <li className="text-xs text-muted-foreground pl-5">
                        +{paymentModal.selectedTierInfo.features.length - 3} more features
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <h4 className="font-medium mb-3">Choose Payment Method</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={selectedPaymentMethod === 'mpesa' ? 'default' : 'outline'}
                    onClick={() => setSelectedPaymentMethod('mpesa')}
                    className="flex items-center gap-2 justify-center h-12"
                  >
                    <Phone className="w-4 h-4" />
                    M-Pesa
                  </Button>
                  <Button
                    variant={selectedPaymentMethod === 'card' ? 'default' : 'outline'}
                    onClick={() => setSelectedPaymentMethod('card')}
                    className="flex items-center gap-2 justify-center h-12"
                  >
                    <Shield className="w-4 h-4" />
                    Card
                  </Button>
                  <Button
                    variant={selectedPaymentMethod === 'apple_pay' ? 'default' : 'outline'}
                    onClick={() => setSelectedPaymentMethod('apple_pay')}
                    className="flex items-center gap-2 justify-center h-12 text-sm"
                  >
                    Apple Pay
                  </Button>
                  <Button
                    variant={selectedPaymentMethod === 'google_pay' ? 'default' : 'outline'}
                    onClick={() => setSelectedPaymentMethod('google_pay')}
                    className="flex items-center gap-2 justify-center h-12 text-sm"
                  >
                    Google Pay
                  </Button>
                </div>

                {/* Phone Number Input for M-Pesa */}
                {selectedPaymentMethod === 'mpesa' && (
                  <div className="mt-4">
                    <label className="text-sm font-medium mb-2 block">
                      M-Pesa Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+254712345678"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      value={phoneNumber}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter your M-Pesa registered number
                    </p>
                  </div>
                )}
              </div>

              {/* IntaSend Payment Button */}
              <div className="space-y-4">
                <Alert>
                  <Phone className="h-4 w-4" />
                  <AlertDescription>
                    {selectedPaymentMethod === 'mpesa' ? (
                      'You\'ll receive an M-Pesa STK push notification. Accept the payment on your phone to complete the transaction.'
                    ) : (
                      'You\'ll be redirected to a secure payment page. Complete your payment to activate the subscription.'
                    )}
                  </AlertDescription>
                </Alert>

                <Button
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  disabled={selectedPaymentMethod === 'mpesa' && !phoneNumber}
                  onClick={async () => {
                    await handleIntaSendPayment();
                  }}
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Pay {formatPrice(paymentModal.selectedTierInfo.price.usd, selectedCurrency)} - Complete {paymentModal.action === 'upgrade' ? 'Upgrade' : 'Registration'}
                </Button>
              </div>

              <div className="text-center text-xs text-muted-foreground">
                <p>🔒 Secured by IntaSend | All transactions are protected</p>
                <p className="mt-1">📱 Instant access after payment confirmation</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Pricing;
