import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import RentalContract from './pages/RentalContract';
import CT01Form from './pages/CT01Form';
import InvoiceForm from './pages/InvoiceForm';
import About from './pages/About';
import SearchPage from './pages/SearchPage';
import MilitaryDocForm from './pages/MilitaryDocForm';
import NotFoundPage from './pages/NotFoundPage';
import TemporaryResidence from './pages/guides/TemporaryResidence';
import PermanentResidence from './pages/guides/PermanentResidence';
import CT07Guide from './pages/guides/CT07Guide';
import LandTitle from './pages/guides/LandTitle';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hop-dong-thue-nha1" element={<RentalContract />} />
          <Route path="/dien-form-ct01" element={<CT01Form />} />
          <Route path="/gioi-thieu" element={<About />} />
          <Route path="/huong-dan/tam-tru" element={<TemporaryResidence />} />
          <Route
            path="/huong-dan/thuong-tru"
            element={<PermanentResidence />}
          />
          <Route path="/huong-dan/ct07" element={<CT07Guide />} />
          <Route path="/huong-dan/sang-ten-so-hong" element={<LandTitle />} />
          <Route path="/hoa-don-ban-hang" element={<InvoiceForm />} />
          <Route path="/ho-so-sua-chua" element={<MilitaryDocForm />} />
          <Route path="/tim-kiem" element={<SearchPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <Analytics />
    </BrowserRouter>
  );
}
