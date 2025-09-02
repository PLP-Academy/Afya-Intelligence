import { supabase } from '@/integrations/supabase/client';
import { Tables, Enums } from '@/integrations/supabase/types';

// M-Pesa STK Push configuration
// Note: For production, implement backend API endpoint for secure key handling
const INTASEND_BASE_URL = 'https://sandbox.intasend.com/api';
const INTASEND_SECRET_KEY = import.meta.env.VITE_INTASEND_SECRET_KEY || 'PLACEHOLDER_SECRET_KEY';
const INTASEND_PUBLISHABLE_KEY = import.meta.env.VITE_INTASEND_PUBLISHABLE_KEY || 'PLACEHOLDER_PUBLISHABLE_KEY';

type SubscriptionTier = Enums<'subscription_tier'>;

export interface UserProfile extends Omit<Tables<'users'>, 'tier'> {
  tier: SubscriptionTier;
}

export interface SubscriptionDetails {
  tier: SubscriptionTier | null;
  subscriptionEndDate: string | null;
  subscriptionId: string | null;
  intasendCustomerId: string | null;
  status: 'active' | 'inactive' | 'trial' | 'expired';
}

export interface InstasendPaymentResult {
  tracking_id: string;
  subscription_id?: string;
  customer_id?: string;
  amount: string;
  currency: string;
  status: string;
  provider: string;
  signature: string;
}

export interface InstasendSTKPushOptions {
  amount: number;
  phone_number: string;
  email?: string;
  callback_url?: string;
  metadata?: Record<string, string>;
}

export interface InstasendSTKPushResponse {
  success: boolean;
  tracking_id?: string;
  message: string;
  qr_code?: string;
  instructions?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
}

/**
 * Get user profile from database (not auth metadata)
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    console.log('🔍 Fetching user profile for ID:', userId);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // If user profile doesn't exist, try to create it
      if (error.code === 'PGRST116') {
        console.log('📝 User profile not found, attempting to create...');

        // Get user metadata from auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) {
          console.error('Error getting auth user:', authError);
          return null;
        }

        if (user) {
          const created = await createUserProfile(user.id, user.email || '', user.user_metadata?.full_name || user.user_metadata?.name);
          if (created) {
            console.log('✅ User profile created successfully');
            // Fetch the newly created profile
            return await getUserProfile(userId);
          }
        }

        return null;
      }

      console.error('Error fetching user profile:', error);
      return null;
    }

    console.log('✅ User profile found:', data);
    return data;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }
}

/**
 * Update user subscription tier in database
 */
export async function updateUserTier(
  userId: string,
  tier: SubscriptionTier,
  subscriptionId?: string,
  intasendCustomerId?: string
): Promise<boolean> {
  try {
    const updateData: Partial<UserProfile> = {
      tier,
      updated_at: new Date().toISOString()
    };

    // Set subscription end date for premium tiers (1 month from now)
    if (tier !== 'community_advocate') {
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
      updateData.subscription_end_date = subscriptionEndDate.toISOString();
    }

    if (subscriptionId) {
      updateData.subscription_id = subscriptionId;
    }

    if (intasendCustomerId) {
      updateData.intasend_customer_id = intasendCustomerId;
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('Error updating user tier:', error);
      return false;
    }

    console.log(`✅ Successfully updated user ${userId} to ${tier} tier`);
    return true;
  } catch (error) {
    console.error('Failed to update user tier:', error);
    return false;
  }
}

/**
 * Create new user profile when they sign up
 */
export async function createUserProfile(userId: string, email: string, fullName?: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').insert({
      id: userId,
      email,
      full_name: fullName || '',
      tier: 'community_advocate', // Default to free tier
      data_sharing_consent: false,
      impact_notifications: false,
      education_completed: false,
      verified: false
    });

    if (error) {
      console.error('Error creating user profile:', error);
      return false;
    }

    console.log(`✅ Created user profile for ${email} (ID: ${userId})`);
    return true;
  } catch (error) {
    console.error('Failed to create user profile:', error);
    return false;
  }
}

/**
 * Get subscription details for a user
 */
export async function getSubscriptionDetails(userId: string): Promise<SubscriptionDetails | null> {
  const profile = await getUserProfile(userId);

  if (!profile) return null;

  // Determine subscription status
  let status: SubscriptionDetails['status'] = 'inactive';

  if (profile.tier === 'community_advocate' || !profile.subscription_end_date) {
    status = 'inactive'; // Free tier is always active
  } else {
    const endDate = new Date(profile.subscription_end_date);
    const now = new Date();

    if (endDate > now) {
      status = 'active';
    } else {
      status = 'expired';
    }
  }

  return {
    tier: profile.tier,
    subscriptionEndDate: profile.subscription_end_date,
    subscriptionId: profile.subscription_id,
    intasendCustomerId: profile.intasend_customer_id,
    status
  };
}

/**
 * Check if user has active premium subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const details = await getSubscriptionDetails(userId);

  if (!details) return false;

  if (details.tier === 'community_advocate') return false;

  return details.status === 'active';
}

/**
 * Handle Instasend payment completion
 */
export async function processInstasendPayment(
  userId: string,
  paymentResult: InstasendPaymentResult | Record<string, unknown>,
  targetTier: SubscriptionTier
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🪙 Processing Instasend payment:', paymentResult);

    const success = await updateUserTier(
      userId,
      targetTier,
      (paymentResult.subscription_id as string) || (paymentResult.tracking_id as string),
      paymentResult.customer_id as string
    );

    if (success) {
      return {
        success: true,
        message: `Payment successful! Your subscription has been upgraded to ${targetTier.replace('_', ' ')}.`
      };
    } else {
      return {
        success: false,
        message: 'Payment was successful but there was an issue updating your subscription. Please contact support.'
      };
    }
  } catch (error) {
    console.error('Error processing Instasend payment:', error);
    return {
      success: false,
      message: 'There was an error processing your subscription upgrade. Please contact support.'
    };
  }
}

/**
 * Initialize user profile on first sign-in
 */
export async function ensureUserProfile(user: AuthUser): Promise<void> {
  if (!user?.id) return;

  const profile = await getUserProfile(user.id);

  // If user profile doesn't exist, create it
  if (!profile) {
    const created = await createUserProfile(
      user.id,
      user.email,
      user.user_metadata?.full_name || user.user_metadata?.name
    );

    if (created) {
      console.log('✅ User profile created/loaded successfully');
    } else {
      console.warn('⚠️ Failed to create/load user profile');
    }
  }
}

/**
 * Upgrade tier with admin privileges (for testing/management)
 */
export async function forceTierUpgrade(userId: string, newTier: SubscriptionTier): Promise<boolean> {
  return await updateUserTier(userId, newTier);
}

/**
 * Get tier pricing information
 */
export function getTierInfo(tier: SubscriptionTier | 'upgrade') {
  const tierData = {
    community_advocate: {
      name: 'Community Advocate',
      price: 'Free',
      color: 'bg-blue-500',
      features: ['30-day history', 'Basic AI', 'Education modules']
    },
    health_champion: {
      name: 'Health Champion',
      price: '$1/month',
      color: 'bg-green-500',
      features: ['Unlimited history', 'Advanced AI', 'Weekly reports', 'Data export']
    },
    global_advocate: {
      name: 'Global Advocate',
      price: '$3/month',
      color: 'bg-purple-500',
      features: ['All features', 'Family tracking', 'Expert consultations', 'Research participation']
    }
  };

  return tier === 'upgrade' ? null : tierData[tier];
}

/**
 * Initiate M-Pesa STK Push payment
 */
/**
 * Initiate M-Pesa STK Push payment
 */
export async function initiateSTKPush(
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string
): Promise<InstasendSTKPushResponse> {
  // Use local proxy in development to avoid CORS issues
  const baseUrl = import.meta.env.DEV
    ? '/api/intasend/v1/payment/collection/stk-push/'
    : 'https://sandbox.intasend.com/api/v1/payment/collection/stk-push/';

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${INTASEND_SECRET_KEY}`,
      'X-IntaSend-Public-Key': INTASEND_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({
      phone_number: phoneNumber,
      amount: amount,
      api_ref: accountReference,
      narrative: transactionDesc,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`STK Push failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Handle STK Push payment confirmation callback
 */
export async function handleSTKPushCallback(callbackData: Record<string, unknown>): Promise<void> {
  try {
    console.log('📞 Received STK Push callback:', callbackData);

    const { tracking_id, status, amount, metadata } = callbackData;

    if (status !== 'SUCCESS') {
      console.log(`❌ Payment failed for tracking ID: ${tracking_id}, status: ${status}`);
      return;
    }

    const callbackMetadata = metadata as { user_id?: string; target_tier?: string };
    const { user_id, target_tier } = callbackMetadata;

    if (!user_id || !target_tier) {
      console.error('Missing user ID or target tier in callback metadata');
      return;
    }

    // Update user tier in database
    const success = await updateUserTier(user_id, target_tier as SubscriptionTier, tracking_id as string);

    if (success) {
      console.log(`✅ User ${user_id} successfully upgraded to ${target_tier} via STK Push`);

      // You can add additional success handling here:
      // - Send confirmation email
      // - Log to analytics
      // - Update user preferences
      // - Trigger welcome workflow

    } else {
      console.error(`❌ Failed to update tier for user ${user_id} despite successful payment`);
    }

  } catch (error) {
    console.error('Error handling STK Push callback:', error);
  }
}

/**
 * Initiate registration with immediate payment for premium tier
 */
export async function initiateRegistrationWithPayment(
  email: string,
  fullName: string,
  phoneNumber: string,
  targetTier: SubscriptionTier,
  price: number
): Promise<{ success: boolean; requires_payment: boolean; payment_data?: InstasendSTKPushResponse; message: string }> {
  try {
    // Create temporary user record first
    const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // For free tier registration, no payment needed
    if (targetTier === 'community_advocate' || price === 0) {
      return {
        success: true,
        requires_payment: false,
        message: 'Free account created successfully!'
      };
    }

    // For premium tiers, initiate STK Push
    const paymentResult = await initiateSTKPush(
      phoneNumber,
      price,
      tempUserId,
      `Registration payment for ${targetTier}`
    );

    if (paymentResult.success) {
      // Store temporary registration data in localStorage/sessionStorage
      sessionStorage.setItem('tempRegistration', JSON.stringify({
        temp_user_id: tempUserId,
        email,
        full_name: fullName,
        phone_number: phoneNumber,
        target_tier: targetTier,
        tracking_id: paymentResult.tracking_id,
        expires_at: Date.now() + (10 * 60 * 1000) // 10 minutes expiry
      }));

      return {
        success: true,
        requires_payment: true,
        payment_data: paymentResult,
        message: 'Payment initiated. Complete payment on your phone to finish registration.'
      };
    } else {
      return {
        success: false,
        requires_payment: true,
        message: paymentResult.message
      };
    }

  } catch (error) {
    console.error('Error initiating registration with payment:', error);
    return {
      success: false,
      requires_payment: false,
      message: 'Registration failed. Please try again.'
    };
  }
}

/**
 * Initiate tier upgrade with payment
 */
export async function initiateUpgradeWithPayment(
  userId: string,
  user: UserProfile | null,
  targetTier: SubscriptionTier,
  price: number
): Promise<InstasendSTKPushResponse> {
  try {
    if (!user) {
      return {
        success: false,
        message: 'User profile not found.'
      };
    }

    const [firstName, lastName] = (user.full_name || 'User').split(' ');

    return await initiateSTKPush(
      user.username || '+254700000000', // TODO: Add phone_number field to users table
      price,
      userId,
      `Upgrade payment for ${targetTier}`
    );

  } catch (error) {
    console.error('Error initiating upgrade with payment:', error);
    return {
      success: false,
      message: 'Failed to initiate payment. Please try again.'
    };
  }
}

/**
 * Complete registration after successful payment
 */
export async function completeRegistrationAfterPayment(
  trackingId: string
): Promise<{ success: boolean; message: string; user?: UserProfile; requires_login?: boolean }> {
  try {
    // Get stored temporary registration data
    const tempDataStr = sessionStorage.getItem('tempRegistration');
    if (!tempDataStr) {
      return {
        success: false,
        message: 'Registration data expired. Please start over.'
      };
    }

    const tempData = JSON.parse(tempDataStr);

    // Check if data hasn't expired
    if (Date.now() > tempData.expires_at) {
      sessionStorage.removeItem('tempRegistration');
      return {
        success: false,
        message: 'Registration session expired. Please start over.'
      };
    }

    // Verify tracking ID matches
    if (tempData.tracking_id !== trackingId) {
      return {
        success: false,
        message: 'Payment tracking ID mismatch.'
      };
    }

    // Now we need to:
    // 1. Create the actual user account (will be handled by Auth)
    // 2. Create user profile with premium tier
    // 3. Clear temp data

    sessionStorage.removeItem('tempRegistration');

    return {
      success: true,
      message: 'Registration completed! Please log in to access your account.',
      requires_login: true
    };

  } catch (error) {
    console.error('Error completing registration:', error);
    return {
      success: false,
      message: 'Failed to complete registration. Please contact support.'
    };
  }
}
