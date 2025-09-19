import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { DataProvider } from './contexts/DataContext';
import MobileApp from './components/mobile/MobileApp';
import { MobileAuthProvider } from './contexts/MobileAuthContext';
import { MobileDataProvider } from './contexts/MobileDataContext';
import LoadingSpinner from './components/LoadingSpinner';


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const AppWrapper = () => (
  <ThemeProvider>
    <LanguageProvider>
      <CurrencyProvider>
        <AuthProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </AuthProvider>
      </CurrencyProvider>
    </LanguageProvider>
  </ThemeProvider>
);

const MobileAppWrapper = () => (
  <ThemeProvider>
    <LanguageProvider>
      <MobileAuthProvider>
        <MobileDataProvider>
          <MobileApp />
        </MobileDataProvider>
      </MobileAuthProvider>
    </LanguageProvider>
  </ThemeProvider>
);

const SimpleRouter = () => {
  const path = window.location.pathname;
  const isEmployeeLoggedIn = !!localStorage.getItem('quickshift-employee');

  if (isEmployeeLoggedIn) {
    // An employee is logged in. They must be contained within the /mobile path.
    if (path !== '/mobile') {
      // If they try to access any other path, force redirect them back to the mobile app.
      window.location.replace('/mobile');
      // Return a loading spinner during the brief moment of redirection.
      return <LoadingSpinner />;
    }
    // They are on the correct path, render the mobile app.
    return <MobileAppWrapper />;
  } else {
    // No employee is logged in. This is either an admin or a public visitor.
    if (path.startsWith('/mobile')) {
      // If they are specifically requesting the mobile path, show the mobile app (which will display the login).
      return <MobileAppWrapper />;
    }
    // For all other paths (e.g., '/'), show the main administrative application.
    return <AppWrapper />;
  }
};

root.render(
  <React.StrictMode>
    <SimpleRouter />
  </React.StrictMode>
);