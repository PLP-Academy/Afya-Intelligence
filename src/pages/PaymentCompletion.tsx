import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Heart,
  Phone,
  Shield,
  Loader2
} from 'lucide-react';

import {
  getUserProfile,
  handleSTKPushCallback,
  completeRegistrationAfterPayment
} from '@/lib/subscriptionService';

const PaymentCompletion = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: authUser } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'timeout'>('loading');
  const [message, setMessage] = useState('Processing your payment...');
  const [userTier, setUserTier] = useState<string>('community_advocate');
  const [trackingId, setTrackingId] = useState<string>('');

  useEffect(() => {
    processPaymentCompletion();
  }, [authUser]);

  const processPaymentCompletion = async () => {
    try {
      const statusParam = searchParams.get('status')?.toUpperCase();
      const trackingIdParam = searchParams.get('tracking_id');
      const paymentType = searchParams.get('payment_type') || 'upgrade';
      const userId = searchParams.get('user_id');

      if (!statusParam || !trackingIdParam) {
        setStatus('failed');
        setMessage('Payment verification failed. Missing required parameters.');
        return;
      }

      setTrackingId(trackingIdParam);

      console.log('Processing payment completion:', {
        status: statusParam,
        trackingId: trackingIdParam,
        paymentType,
        userId
      });

      if (statusParam === 'SUCCESS') {
        // Handle successful payment
        const callbackData = {
          tracking_id: trackingIdParam,
          status: statusParam,
          amount: searchParams.get('amount') || '0',
          currency: 'KES',
          metadata: {
            user_id: userId || authUser?.id || '',
            target_tier: searchParams.get('target_tier') || 'health_champion',
            payment_type: paymentType
          }
        };

        // For registration completion
        if (paymentType === 'registration') {
          const result = await completeRegistrationAfterPayment(trackingIdParam);
          if (result.success) {
            setStatus('success');
            setMessage(result.message);
            if (result.requires_login) {
              navigate('/auth');
              return;
            }
          } else {
            setStatus('failed');
            setMessage(result.message);
            return;
          }
        }

        // For upgrade/regular payment
        await handleSTKPushCallback(callbackData);

        // Get updated user profile to show new tier
        if (authUser?.id) {
          const profile = await getUserProfile(authUser.id);
          if (profile) {
            setUserTier(profile.tier || 'community_advocate');
          }
        }

        setStatus('success');
        setMessage('Payment completed successfully! Your subscription has been updated.');

      } else if (statusParam === 'FAILED') {
        setStatus('failed');
        setMessage('Payment was not completed. Please try again or contact support.');

      } else {
        setStatus('timeout');
        setMessage('Payment timed out. Please check your phone and try again if needed.');
      }

    } catch (error) {
      console.error('Error processing payment completion:', error);
      setStatus('failed');
      setMessage('An error occurred while processing your payment. Please contact support.');
    }
  };

  const handleContinue = () => {
    if (status === 'success') {
      navigate('/dashboard');
    } else {
      navigate('/pricing');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-16 h-16 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'timeout':
        return <Clock className="w-16 h-16 text-yellow-500" />;
      default:
        return <Loader2 className="w-16 h-16 text-gray-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'success':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      case 'timeout':
        return 'Payment Timed Out';
      default:
        return 'Processing Payment...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'timeout':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-8 h-8 rounded-lg health-gradient flex items-center justify-center mx-auto mb-4">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-2xl mb-2">Symptom Journal</CardTitle>
          <CardDescription>Payment Verification</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            {getStatusIcon()}
            <h3 className={`text-xl font-semibold mt-4 mb-2 ${getStatusColor()}`}>
              {getStatusTitle()}
            </h3>
            <p className="text-muted-foreground">
              {message}
            </p>
          </div>

          {trackingId && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tracking ID:</span>
                <span className="font-mono">{trackingId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Your Tier:</span>
                <Badge variant="outline" className="capitalize">
                  {userTier.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          )}

          {status === 'success' && userTier !== 'community_advocate' && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Premium Features Unlocked:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Advanced AI insights with DialogueGPT</li>
                  <li>Unlimited symptom history</li>
                  <li>Weekly personalized reports</li>
                  <li>Data export capabilities</li>
                  {/* Add more based on tier */}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {(status === 'failed' || status === 'timeout') && (
            <Alert>
              <Phone className="h-4 w-4" />
              <AlertDescription>
                <strong>What happened?</strong> Your M-Pesa transaction was not completed successfully.
                This may be due to:
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Insufficient funds</li>
                  <li>Transaction timeout</li>
                  <li>Cancelled on your phone</li>
                  <li>Network connectivity issues</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleContinue}
              className="w-full health-button"
              size="lg"
            >
              {status === 'success' ? 'Continue to Dashboard' : 'Try Again'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            {status === 'failed' && (
              <Button
                onClick={() => navigate('/pricing')}
                variant="outline"
                className="w-full"
              >
                Back to Pricing
              </Button>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              If you have any questions, please contact our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCompletion;
