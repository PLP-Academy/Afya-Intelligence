import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import {
  Crown,
  Star,
  ArrowRight,
  Heart,
  Phone,
  Shield,
  Zap,
  AlertCircle
} from 'lucide-react';

import {
  getUserProfile,
  hasActiveSubscription,
  initiateSTKPush
} from '@/lib/subscriptionService';

import { InstasendSTKPushResponse } from '@/lib/subscriptionService';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredTier?: 'community_advocate' | 'health_champion' | 'global_advocate';
  feature?: string;
  showUpgrade?: boolean;
}

const SubscriptionGuard = ({
  children,
  requiredTier = 'health_champion',
  feature = 'Premium Feature',
  showUpgrade = true
}: SubscriptionGuardProps) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userTier, setUserTier] = useState<string>('community_advocate');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<InstasendSTKPushResponse | null>(null);

  useEffect(() => {
    checkSubscriptionAccess();
  }, [authUser, requiredTier]);

  const checkSubscriptionAccess = async () => {
    if (!authUser?.id) {
      setHasAccess(false);
      setIsLoading(false);
      return;
    }

    try {
      // Get user profile
      const profile = await getUserProfile(authUser.id);
      if (profile) {
        setUserTier(profile.tier || 'community_advocate');

        // Check if user has required tier
        if (profile.tier === requiredTier ||
            (requiredTier === 'health_champion' && profile.tier === 'global_advocate') ||
            (requiredTier === 'community_advocate')) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasAccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeClick = async () => {
    setIsLoading(true);

    try {
      if (!authUser?.id) {
        navigate('/auth');
        return;
      }

      const profile = await getUserProfile(authUser.id);
      if (profile?.username) {
        // Phone number is stored as username for now (should be added as separate field)
        const phoneNumber = profile.username; // TODO: Add phone_number field to users table

        if (!phoneNumber || !phoneNumber.match(/^\+254\d{9}$/)) {
          alert('Please update your profile with a valid M-Pesa phone number in format: +254xxxxxxxxx');
          navigate('/profile');
          return;
        }

        // Determine price based on target tier
        const prices = {
          health_champion: 150,
          global_advocate: 400
        };

        const targetPrice = prices[requiredTier as keyof typeof prices] || 150;

        const paymentResult = await initiateSTKPush(
          targetPrice,
          phoneNumber,
          authUser.id,
          requiredTier,
          profile.email,
          profile.full_name?.split(' ')[0] || 'User',
          profile.full_name?.split(' ').slice(1).join(' ') || ''
        );

        if (paymentResult.success) {
          setPaymentData(paymentResult);
          setShowPaymentModal(true);
        } else {
          alert(paymentResult.message);
        }
      } else {
        alert('Please complete your profile first');
        navigate('/profile');
      }

    } catch (error) {
      console.error('Error initiating upgrade:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access - show upgrade prompt
  if (!showUpgrade) {
    return null;
  }

  const getPlanDetails = () => {
    const plans = {
      health_champion: {
        name: 'Health Champion',
        icon: Heart,
        color: 'text-green-600',
        price: 'KES 150/month',
        usdEquivalent: '~USD $1.10',
        features: [
          'Advanced AI insights',
          'Unlimited history',
          'Priority support'
        ]
      },
      global_advocate: {
        name: 'Global Advocate',
        icon: Crown,
        color: 'text-purple-600',
        price: 'KES 400/month',
        usdEquivalent: '~USD $3.00',
        features: [
          'All Champion features',
          'Expert consultations',
          'Research participation',
          'Family coordination'
        ]
      }
    };
    return plans[requiredTier as keyof typeof plans] || plans.health_champion;
  };

  const planDetails = getPlanDetails();
  const PlanIcon = planDetails.icon;

  return (
    <>
      <Card className="border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white">
        <CardHeader className="text-center">
          <div className={`w-16 h-16 ${planDetails.color} rounded-full flex items-center justify-center mx-auto mb-4 bg-gray-100`}>
            <PlanIcon className="w-8 h-8" />
          </div>
          <CardTitle className="text-xl mb-2">
            Upgrade to {planDetails.name} to Access {feature}
          </CardTitle>
          <CardDescription>
            Get unlimited access to premium features with our M-Pesa payment integration
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {planDetails.price}
            </div>
            <div className="text-sm text-gray-600">
              {planDetails.usdEquivalent}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-center">What you get:</h4>
            <ul className="space-y-2">
              {planDetails.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>M-Pesa Payment:</strong> Instant mobile payment with push notification.
              Pay {planDetails.price} and get immediate premium access.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              onClick={handleUpgradeClick}
              disabled={isLoading}
              className="flex-1 health-button"
              size="lg"
            >
              {isLoading ? 'Processing...' : `Upgrade with M-Pesa`}
              <Phone className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => navigate('/pricing')}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              View All Plans
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="text-center">
            <Badge variant="secondary" className="capitalize">
              Current Tier: {userTier.replace('_', ' ')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {showPaymentModal && paymentData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-500" />
                  M-Pesa Payment
                </CardTitle>
                <Button
                  onClick={() => setShowPaymentModal(false)}
                  variant="ghost"
                  size="sm"
                  className="p-1"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Payment Initiated!</h3>
                <p className="text-muted-foreground mb-4">
                  {paymentData.message}
                </p>

                {paymentData.instructions && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <p className="text-sm text-green-800">
                        {paymentData.instructions}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tracking ID:</span>
                  <span className="font-mono">{paymentData.tracking_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <Badge variant="default">Payment Requested</Badge>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Please stay on this page. Payment processing may take a few moments.
                  Your subscription will activate automatically upon successful payment.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowPaymentModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => navigate('/payment-completion')}
                  className="flex-1 health-button"
                >
                  Check Status
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default SubscriptionGuard;
