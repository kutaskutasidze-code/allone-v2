'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ContactInfo {
  email: string;
  location: string;
  phone?: string | null;
}

interface ContactInfoContextType {
  contactInfo: ContactInfo;
  isLoading: boolean;
  error: Error | null;
}

const DEFAULT_CONTACT_INFO: ContactInfo = {
  email: 'info@allone.ge',
  location: 'San Francisco, CA',
  phone: null,
};

const ContactInfoContext = createContext<ContactInfoContextType>({
  contactInfo: DEFAULT_CONTACT_INFO,
  isLoading: true,
  error: null,
});

export function ContactInfoProvider({ children }: { children: ReactNode }) {
  const [contactInfo, setContactInfo] = useState<ContactInfo>(DEFAULT_CONTACT_INFO);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchContactInfo() {
      try {
        const response = await fetch('/api/contact-info');

        if (!response.ok) {
          throw new Error(`Failed to fetch contact info: ${response.status}`);
        }

        const data = await response.json();

        if (isMounted) {
          // Handle the standardized API response format
          if (data.data) {
            setContactInfo(data.data);
          } else if (data.email) {
            // Legacy format support
            setContactInfo(data);
          }
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          const error = err instanceof Error ? err : new Error('Unknown error');
          setError(error);
          // Log error but keep default values - don't break the UI
          if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.error('Failed to fetch contact info:', error);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchContactInfo();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ContactInfoContext.Provider value={{ contactInfo, isLoading, error }}>
      {children}
    </ContactInfoContext.Provider>
  );
}

export function useContactInfo() {
  const context = useContext(ContactInfoContext);
  if (!context) {
    throw new Error('useContactInfo must be used within a ContactInfoProvider');
  }
  return context;
}
