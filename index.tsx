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
  // Force mobile app preview
  return <MobileAppWrapper />;
};

root.render(
  <React.StrictMode>
    <SimpleRouter />
  </React.StrictMode>
);