
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from '../App';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { onSnapshot, doc, collection, getDoc } from 'firebase/firestore';
import { useStore } from '../store';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
  })),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()), // Returns unsubscribe
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  getDocFromServer: vi.fn(),
  deleteDoc: vi.fn(),
  deleteField: vi.fn(),
}));

// Mock Gemini Service
vi.mock('../geminiService', () => ({
  gemini: {
    analyzeBrand: vi.fn().mockResolvedValue({
      name: 'Test Brand',
      description: 'Test Description',
      colors: [],
      pillars: [],
    }),
    generatePost: vi.fn(),
    refineBrandDNA: vi.fn(),
  },
}));

// Mock lucide-react
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal() as any;
  const mockedIcons: any = {};
  Object.keys(actual).forEach(key => {
    mockedIcons[key] = (props: any) => <span data-testid={`icon-${key.toLowerCase()}`} {...props} />;
  });
  return mockedIcons;
});

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    header: ({ children, ...props }: any) => <header {...props}>{children}</header>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    svg: ({ children, ...props }: any) => <svg {...props}>{children}</svg>,
    nav: ({ children, ...props }: any) => <nav {...props}>{children}</nav>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    img: ({ children, ...props }: any) => <img {...props} />,
    a: ({ children, ...props }: any) => <a {...props}>{children}</a>,
    footer: ({ children, ...props }: any) => <footer {...props}>{children}</footer>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
  }),
  useInView: () => [vi.fn(), true],
}));

describe('Main User Journey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ workspaceId: 'test-workspace-id' }),
    });

    // Default mock for onAuthStateChanged (initially logged out)
    (onAuthStateChanged as any).mockImplementation((auth: any, callback: any) => {
      callback(null);
      return vi.fn(); // unsubscribe
    });
  });

  it('should allow a user to log in and navigate to Brand Kit', async () => {
    render(<App />);

    // Wait for loading spinner to disappear
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    }, { timeout: 15000 });

    // 1. Check if Landing Page is rendered
    // Using Polish text as default language is PL
    expect(screen.getByText(/SociAI MediA Studio/i)).toBeInTheDocument();
    
    // The button text is "ROZPOCZNIJ MISJĘ" in PL
    const startButton = screen.getByText(/ROZPOCZNIJ MISJĘ/i);
    expect(startButton).toBeInTheDocument();

    // 2. Simulate Login
    (signInWithPopup as any).mockResolvedValueOnce({
      user: {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      },
    });

    // Update onAuthStateChanged mock to simulate logged in state
    (onAuthStateChanged as any).mockImplementation((auth: any, callback: any) => {
      callback({
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      });
      return vi.fn();
    });

    // Mock getDoc for user profile
    (getDoc as any).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        onboardingStep: 0,
        brand: { name: 'Test Brand' },
      }),
    });

    fireEvent.click(startButton);

    // 3. Wait for Dashboard/AppShell to load
    await waitFor(() => {
      // Dashboard view should have "Centrum Dowodzenia" in PL
      expect(screen.getByText(/Centrum Dowodzenia/i)).toBeInTheDocument();
    }, { timeout: 15000 });

    // 4. Navigate to Brand Kit
    // Brand Kit is "DNA Marki" in PL
    const brandKitLink = screen.getByText(/DNA Marki/i);
    fireEvent.click(brandKitLink);

    // 5. Verify Brand Kit page is loaded
    await waitFor(() => {
      // Brand Kit title is "Silnik DNA Marki" in PL
      expect(screen.getByText(/Silnik DNA Marki/i)).toBeInTheDocument();
    }, { timeout: 15000 });
  }, 30000);
});
