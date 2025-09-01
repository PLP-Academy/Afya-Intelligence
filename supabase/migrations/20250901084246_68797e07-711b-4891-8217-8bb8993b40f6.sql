-- First enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_education_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_impact ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdg_content ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own profile" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid()::text = id::text);

-- Create RLS policies for symptoms table
CREATE POLICY "Users can view their own symptoms" 
ON public.symptoms 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own symptoms" 
ON public.symptoms 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own symptoms" 
ON public.symptoms 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own symptoms" 
ON public.symptoms 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for user_education_progress table
CREATE POLICY "Users can view their own education progress" 
ON public.user_education_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own education progress" 
ON public.user_education_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own education progress" 
ON public.user_education_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for public content (sdg_content and community_impact are viewable by everyone)
CREATE POLICY "SDG content is viewable by everyone" 
ON public.sdg_content 
FOR SELECT 
USING (true);

CREATE POLICY "Community impact is viewable by everyone" 
ON public.community_impact 
FOR SELECT 
USING (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();