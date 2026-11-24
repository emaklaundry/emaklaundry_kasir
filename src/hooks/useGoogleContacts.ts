import { useState, useCallback } from 'react';

// Types for Google Contacts
export interface GoogleContact {
  resourceName: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
}

interface PersonResource {
  resourceName: string;
  names?: Array<{ displayName?: string }>;
  phoneNumbers?: Array<{ value?: string }>;
  addresses?: Array<{ formattedValue?: string }>;
  emailAddresses?: Array<{ value?: string }>;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

// Declare google global
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/contacts'; // Changed from readonly to full access

export function useGoogleContacts() {
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const signIn = useCallback(() => {
    if (!window.google) {
      setError('Google API belum dimuat. Refresh halaman dan coba lagi.');
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      setError('Google Client ID belum dikonfigurasi di .env');
      return;
    }

    setIsLoading(true);
    setError(null);

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (response: TokenResponse) => {
        if (response.access_token) {
          setAccessToken(response.access_token);
          setIsAuthenticated(true);
          setIsLoading(false);
        } else {
          setError('Gagal mendapatkan akses token');
          setIsLoading(false);
        }
      },
    });

    tokenClient.requestAccessToken();
  }, []);

  const fetchContacts = useCallback(async () => {
    if (!accessToken) {
      setError('Belum terautentikasi. Silakan login dulu.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?' +
          new URLSearchParams({
            personFields: 'names,phoneNumbers,addresses,emailAddresses',
            pageSize: '1000',
            sortOrder: 'FIRST_NAME_ASCENDING',
          }),
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const connections: PersonResource[] = data.connections || [];

      // Filter contacts yang memiliki nama dan nomor telepon
      const parsedContacts: GoogleContact[] = connections
        .filter(
          (person) =>
            person.names?.length &&
            person.names[0]?.displayName &&
            person.phoneNumbers?.length &&
            person.phoneNumbers[0]?.value,
        )
        .map((person) => ({
          resourceName: person.resourceName,
          name: person.names![0].displayName!,
          phone: person.phoneNumbers![0].value!,
          address: person.addresses?.[0]?.formattedValue || '',
          email: person.emailAddresses?.[0]?.value,
        }));

      setContacts(parsedContacts);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengambil kontak';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const createContact = useCallback(async (contact: {
    name: string;
    phone: string;
    address?: string;
    email?: string;
  }) => {
    if (!accessToken) {
      throw new Error('Belum terautentikasi');
    }

    const body = {
      names: [{ givenName: contact.name }],
      phoneNumbers: [{ value: contact.phone }],
      addresses: contact.address ? [{ streetAddress: contact.address }] : [],
      emailAddresses: contact.email ? [{ value: contact.email }] : [],
    };

    const response = await fetch(
      'https://people.googleapis.com/v1/people:createContact',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Gagal membuat kontak');
    }

    return await response.json();
  }, [accessToken]);

  const signOut = useCallback(() => {
    setAccessToken(null);
    setIsAuthenticated(false);
    setContacts([]);
  }, []);

  return {
    contacts,
    isLoading,
    error,
    isAuthenticated,
    signIn,
    signOut,
    fetchContacts,
    createContact,
  };
}

export default useGoogleContacts;
