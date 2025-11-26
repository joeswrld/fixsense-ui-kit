import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const useOnboardingGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [onboardingRequired, setOnboardingRequired] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, [location.pathname]);

  const checkOnboardingStatus = async () => {
    try {
      // Skip check if already on auth or onboarding pages
      if (location.pathname === '/auth' || location.pathname === '/onboarding') {
        setChecking(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      // If no user, redirect to auth
      if (!user) {
        navigate('/auth');
        setChecking(false);
        return;
      }

      // Check onboarding status
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      // If onboarding not completed, redirect to onboarding
      if (!profile?.onboarding_completed) {
        setOnboardingRequired(true);
        if (location.pathname !== '/onboarding') {
          navigate('/onboarding');
        }
      } else {
        setOnboardingRequired(false);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setChecking(false);
    }
  };

  return { checking, onboardingRequired };
};