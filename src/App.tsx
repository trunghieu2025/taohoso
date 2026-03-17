import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import QuickSearch from './components/QuickSearch';

// Lazy-loaded pages — each page is loaded only when navigated to
const Home = lazy(() => import('./pages/Home'));
const RentalContract = lazy(() => import('./pages/RentalContract'));
const CT01Form = lazy(() => import('./pages/CT01Form'));
const InvoiceForm = lazy(() => import('./pages/InvoiceForm'));
const About = lazy(() => import('./pages/About'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const MilitaryDocForm = lazy(() => import('./pages/MilitaryDocForm'));
const BundleForm = lazy(() => import('./pages/BundleForm'));
const ProjectList = lazy(() => import('./pages/ProjectList'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const ContractorDirectory = lazy(() => import('./pages/ContractorDirectory'));
const ProjectSearchAll = lazy(() => import('./pages/ProjectSearchAll'));
const ProjectCompare = lazy(() => import('./pages/ProjectCompare'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const FileDiff = lazy(() => import('./pages/FileDiff'));
const TemplateMarketplace = lazy(() => import('./pages/TemplateMarketplace'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const GuidePage = lazy(() => import('./pages/GuidePage'));


function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: '0.75rem', color: '#64748b', fontSize: '1rem',
    }}>
      <div style={{
        width: 28, height: 28, border: '3px solid #e2e8f0',
        borderTopColor: '#10b981', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      Đang tải...
    </div>
  );
}

// Detect desktop mode
const isDesktop = typeof window !== 'undefined' && (
  (window as any).electronAPI?.isDesktop || window.location.protocol === 'file:'
);

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Header />
      <QuickSearch />
      <main>
        <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hop-dong-thue-nha" element={<RentalContract />} />
          <Route path="/dien-form-ct01" element={<CT01Form />} />
          <Route path="/gioi-thieu" element={<About />} />

          <Route path="/hoa-don-ban-hang" element={<InvoiceForm />} />
          <Route path="/ho-so-sua-chua" element={<MilitaryDocForm />} />
          <Route path="/goi-mau" element={<BundleForm />} />
          <Route path="/quan-ly-du-an" element={<ProjectList />} />
          <Route path="/du-an/:id" element={<ProjectDetail />} />
          <Route path="/danh-ba-nha-thau" element={<ContractorDirectory />} />
          <Route path="/tra-cuu-du-an" element={<ProjectSearchAll />} />
          <Route path="/so-sanh-du-an" element={<ProjectCompare />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/so-sanh-file" element={<FileDiff />} />
          <Route path="/thu-vien-mau" element={<TemplateMarketplace />} />
          <Route path="/cai-dat" element={<SettingsPage />} />
          <Route path="/huong-dan" element={<GuidePage />} />
          <Route path="/tim-kiem" element={<SearchPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </main>
      <Footer />

    </HashRouter>
  );
}
