-- Add phone_number field to users table for M-Pesa payments
ALTER TABLE public.users
ADD COLUMN phone_number VARCHAR(15);

-- Add comment for the new column
COMMENT ON COLUMN public.users.phone_number IS 'User phone number in international format (e.g., +254xxxxxxxxx) for M-Pesa payments';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON public.users(phone_number);
