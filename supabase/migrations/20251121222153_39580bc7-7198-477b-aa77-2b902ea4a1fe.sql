-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'business')),
  diagnostics_used_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appliances table
CREATE TABLE public.appliances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  purchase_date DATE,
  status TEXT DEFAULT 'good' CHECK (status IN ('good', 'warning', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create diagnostics table
CREATE TABLE public.diagnostics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties ON DELETE SET NULL,
  appliance_id UUID REFERENCES public.appliances ON DELETE SET NULL,
  input_type TEXT NOT NULL CHECK (input_type IN ('photo', 'video', 'audio', 'text')),
  file_url TEXT,
  description TEXT,
  diagnosis_summary TEXT,
  probable_causes TEXT[],
  estimated_cost_min DECIMAL(10, 2),
  estimated_cost_max DECIMAL(10, 2),
  urgency TEXT CHECK (urgency IN ('safe', 'warning', 'critical')),
  scam_alerts TEXT[],
  fix_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Properties policies
CREATE POLICY "Users can view their own properties"
  ON public.properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own properties"
  ON public.properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties"
  ON public.properties FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties"
  ON public.properties FOR DELETE
  USING (auth.uid() = user_id);

-- Appliances policies
CREATE POLICY "Users can view appliances for their properties"
  ON public.appliances FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = appliances.property_id
    AND properties.user_id = auth.uid()
  ));

CREATE POLICY "Users can create appliances for their properties"
  ON public.appliances FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = appliances.property_id
    AND properties.user_id = auth.uid()
  ));

CREATE POLICY "Users can update appliances for their properties"
  ON public.appliances FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = appliances.property_id
    AND properties.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete appliances for their properties"
  ON public.appliances FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = appliances.property_id
    AND properties.user_id = auth.uid()
  ));

-- Diagnostics policies
CREATE POLICY "Users can view their own diagnostics"
  ON public.diagnostics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own diagnostics"
  ON public.diagnostics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diagnostics"
  ON public.diagnostics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diagnostics"
  ON public.diagnostics FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appliances_updated_at
  BEFORE UPDATE ON public.appliances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();