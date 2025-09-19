import React from 'react';
import { Calendar, Users, BarChart3, LogIn, Twitter, Linkedin, Facebook, Zap, Eye, UsersRound, ArrowRight, UserCheck, CalendarOff, Briefcase, FileDown, Bell, Smartphone } from 'lucide-react';
import Pricing from './Pricing';
import ThemeToggle from './ThemeToggle';
import { Plan } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import AnimatedDemos from './AnimatedDemos';
import Avatar from './Avatar';
import Logo from './Logo';


interface LandingPageProps {
  onLoginClick: () => void;
  onRegisterClick: (plan: Plan) => void;
}

interface LandingHeaderProps {
  onLoginClick: () => void;
  onRegisterClick: (plan: Plan) => void;
  handleScroll: (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
}

const LandingHeader: React.FC<LandingHeaderProps> = ({ onLoginClick, onRegisterClick, handleScroll }) => {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 bg-white/80 dark:bg-blue-night-950/80 backdrop-blur-sm z-40 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Logo className="w-8 h-8" />
          <h1 className="text-2xl font-bold ml-3 text-gray-800 dark:text-white">{t('appName')}</h1>
        </div>
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" onClick={(e) => handleScroll(e, 'features')} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">{t('landingPage.navFeatures')}</a>
          <a href="#pricing" onClick={(e) => handleScroll(e, 'pricing')} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">{t('landingPage.navPricing')}</a>
        </nav>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <ThemeToggle />
          <button onClick={onLoginClick} className="hidden md:flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold">
            <LogIn size={16} className="mr-2" />
            {t('landingPage.login')}
          </button>
          <button onClick={() => onRegisterClick('Pro')} className="hidden md:block bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-night-200 dark:text-blue-night-900 dark:hover:bg-blue-night-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 shadow-lg shadow-blue-500/20">
            {t('landingPage.getStarted')}
          </button>
        </div>
      </div>
    </header>
  );
};

const FeatureShowcase: React.FC<{
    title: string;
    description: string;
    demo: React.ReactNode;
    align: 'left' | 'right';
}> = ({ title, description, demo, align }) => (
    <div className={`grid md:grid-cols-2 gap-12 items-center ${align === 'right' ? 'md:grid-flow-col-dense' : ''}`}>
        <div className={`space-y-4 ${align === 'right' ? 'md:col-start-2' : ''}`}>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-lg text-gray-600 dark:text-gray-400">{description}</p>
        </div>
        <div className="md:col-start-1">
            {demo}
        </div>
    </div>
);

const TestimonialCard: React.FC<{ quote: string; name: string; role: string; company: string; }> = ({ quote, name, role, company }) => (
    <div className="bg-white dark:bg-blue-night-900 p-8 rounded-xl shadow-lg flex flex-col h-full">
        <p className="text-gray-600 dark:text-gray-300 flex-grow">"{quote}"</p>
        <div className="mt-6 flex items-center">
            <Avatar name={name} src={null} className="w-12 h-12 rounded-full" />
            <div className="ml-4">
                <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
                <p className="text-gray-500 dark:text-gray-400">{role}, {company}</p>
            </div>
        </div>
    </div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => (
  <div className="bg-white dark:bg-blue-night-900 p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg mb-4">
      {icon}
    </div>
    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h4>
    <p className="mt-1 text-gray-600 dark:text-gray-400">{description}</p>
  </div>
);


const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onRegisterClick }) => {
  const { t } = useLanguage();
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  return (
    <div className="bg-gray-50 dark:bg-blue-night-950 text-gray-800 dark:text-gray-300 font-sans">
      <LandingHeader onLoginClick={onLoginClick} onRegisterClick={onRegisterClick} handleScroll={handleScroll} />

      <main>
        {/* Hero Section */}
        <section className="relative text-center py-20 md:py-28 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-gray-50 dark:from-blue-night-900/10 dark:to-blue-night-950 -z-10"></div>
            <div className="container mx-auto">
                <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight"
                dangerouslySetInnerHTML={{
                    __html: t('landingPage.heroTitle', {
                    highlight: `<span class="text-blue-600 dark:text-blue-night-200">${t('landingPage.heroTitleHighlight')}</span>`
                    })
                }}>
                </h2>
                <p className="mt-6 text-lg md:text-xl max-w-3xl mx-auto text-gray-600 dark:text-gray-400">
                {t('landingPage.heroSubtitle')}
                </p>
                <div className="mt-10 flex justify-center items-center gap-4">
                    <button onClick={() => onRegisterClick('Gratuit')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform duration-300 transform hover:scale-105 dark:bg-blue-night-200 dark:text-blue-night-900 dark:hover:bg-blue-night-300 shadow-lg shadow-blue-500/20">
                         {t('landingPage.startForFree')}
                    </button>
                </div>
                <div className="mt-16 animate-slide-in-up [animation-delay:300ms]">
                    <AnimatedDemos.AppWindow />
                </div>
            </div>
        </section>


        {/* Features Section */}
        <section id="features" className="py-24 bg-white dark:bg-blue-night-900">
          <div className="container mx-auto px-6 space-y-24">
            <div className="text-center">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{t('landingPage.featuresTitle')}</h2>
                <p className="mt-4 text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-400">
                    {t('landingPage.featuresSubtitle')}
                </p>
            </div>
            
            <FeatureShowcase 
                title={t('landingPage.feature1Title')}
                description={t('landingPage.feature1Desc')}
                demo={<AnimatedDemos.CalendarDemo />}
                align="right"
            />
            <FeatureShowcase 
                title={t('landingPage.feature2Title')}
                description={t('landingPage.feature2Desc')}
                demo={<AnimatedDemos.DashboardDemo />}
                align="left"
            />
             <FeatureShowcase 
                title={t('landingPage.feature3Title')}
                description={t('landingPage.feature3Desc')}
                demo={<AnimatedDemos.RosterDemo />}
                align="right"
            />

            <div>
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{t('landingPage.featuresGridTitle')}</h3>
                <p className="mt-3 text-lg max-w-3xl mx-auto text-gray-600 dark:text-gray-400">
                  {t('landingPage.featuresGridSubtitle')}
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <FeatureCard 
                      icon={<UserCheck size={28} className="text-blue-600 dark:text-blue-400"/>}
                      title={t('landingPage.featureGrid1Title')}
                      description={t('landingPage.featureGrid1Desc')}
                  />
                  <FeatureCard 
                      icon={<CalendarOff size={28} className="text-blue-600 dark:text-blue-400"/>}
                      title={t('landingPage.featureGrid2Title')}
                      description={t('landingPage.featureGrid2Desc')}
                  />
                  <FeatureCard 
                      icon={<Briefcase size={28} className="text-blue-600 dark:text-blue-400"/>}
                      title={t('landingPage.featureGrid3Title')}
                      description={t('landingPage.featureGrid3Desc')}
                  />
                  <FeatureCard 
                      icon={<FileDown size={28} className="text-blue-600 dark:text-blue-400"/>}
                      title={t('landingPage.featureGrid4Title')}
                      description={t('landingPage.featureGrid4Desc')}
                  />
                  <FeatureCard 
                      icon={<Bell size={28} className="text-blue-600 dark:text-blue-400"/>}
                      title={t('landingPage.featureGrid5Title')}
                      description={t('landingPage.featureGrid5Desc')}
                  />
                  <FeatureCard 
                      icon={<Smartphone size={28} className="text-blue-600 dark:text-blue-400"/>}
                      title={t('landingPage.featureGrid6Title')}
                      description={t('landingPage.featureGrid6Desc')}
                  />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24">
            <div className="container mx-auto px-6">
                 <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{t('landingPage.testimonialsTitle')}</h2>
                    <p className="mt-4 text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-400">
                        {t('landingPage.testimonialsSubtitle')}
                    </p>
                </div>
                <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
                    <TestimonialCard 
                        quote={t('landingPage.testimonial1Quote')}
                        name="Sarah L."
                        role={t('landingPage.testimonial1Role')}
                        company="The Corner Cafe"
                    />
                     <TestimonialCard 
                        quote={t('landingPage.testimonial2Quote')}
                        name="David M."
                        role={t('landingPage.testimonial2Role')}
                        company="City Retail"
                    />
                     <TestimonialCard 
                        quote={t('landingPage.testimonial3Quote')}
                        name="Jessica P."
                        role={t('landingPage.testimonial3Role')}
                        company="HealthPoint Clinic"
                    />
                </div>
            </div>
        </section>


        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-white dark:bg-blue-night-900">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{t('landingPage.pricingTitle')}</h2>
                <p className="mt-4 text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-400">
                    {t('landingPage.pricingSubtitle')}
                </p>
            </div>
            <Pricing onSelectPlan={onRegisterClick} />
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24">
            <div className="container mx-auto px-6 text-center">
                 <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{t('landingPage.ctaTitle')}</h2>
                 <p className="mt-4 text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-400">
                    {t('landingPage.ctaSubtitle')}
                </p>
                <button onClick={() => onRegisterClick('Gratuit')} className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-lg text-xl transition-transform duration-300 transform hover:scale-105 dark:bg-blue-night-200 dark:text-blue-night-900 dark:hover:bg-blue-night-300 shadow-lg shadow-blue-500/30">
                     {t('landingPage.ctaButton')}
                </button>
            </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-blue-night-900 border-t border-gray-200 dark:border-blue-night-800">
        <div className="container mx-auto px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="col-span-2 md:col-span-2">
                     <div className="flex items-center">
                        <Logo className="w-8 h-8" />
                        <h1 className="text-xl font-bold ml-3 text-gray-800 dark:text-white">{t('appName')}</h1>
                    </div>
                    <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">
                        {t('landingPage.footerDesc')}
                    </p>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white">{t('landingPage.footerProduct')}</h4>
                    <ul className="mt-4 space-y-2 text-sm">
                        <li><a href="#features" onClick={(e) => handleScroll(e, 'features')} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white">{t('landingPage.navFeatures')}</a></li>
                        <li><a href="#pricing" onClick={(e) => handleScroll(e, 'pricing')} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white">{t('landingPage.navPricing')}</a></li>
                        <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white">{t('landingPage.footerUpdates')}</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white">{t('landingPage.footerResources')}</h4>
                    <ul className="mt-4 space-y-2 text-sm">
                        <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white">{t('landingPage.footerHelp')}</a></li>
                        <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white">{t('landingPage.footerPrivacy')}</a></li>
                         <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white">{t('landingPage.footerTerms')}</a></li>
                    </ul>
                </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-blue-night-800 flex flex-col sm:flex-row justify-between items-center">
                 <p className="text-sm text-gray-500 dark:text-gray-400">{t('landingPage.footer', { year: new Date().getFullYear() })}</p>
                 <div className="flex space-x-4 mt-4 sm:mt-0">
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500 dark:hover:text-white"><Twitter size={20}/></a>
                    <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500 dark:hover:text-white"><Facebook size={20}/></a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500 dark:hover:text-white"><Linkedin size={20}/></a>
                 </div>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;