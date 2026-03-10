import { useState, useEffect } from 'react';

interface Step {
    target: string; // CSS selector
    title: string;
    content: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const BUNDLE_STEPS: Step[] = [
    { target: '#upload-area', title: '📁 Bước 1: Upload file', content: 'Kéo thả hoặc bấm để chọn file .docx / .xlsx. Có thể upload cả thư mục.', position: 'bottom' },
    { target: '#scan-btn', title: '🔍 Bước 2: Quét file', content: 'Bấm nút này để quét tất cả file. Hệ thống tự tìm dữ liệu trùng lặp và trường [BRACKET].', position: 'bottom' },
    { target: '#form-area', title: '📝 Bước 3: Điền dữ liệu', content: 'Nhập dữ liệu 1 lần → áp dụng cho TẤT CẢ file. Trường được phân nhóm tự động.', position: 'top' },
    { target: '#export-area', title: '📦 Bước 4: Xuất file', content: 'Xuất ZIP tất cả file, hoặc xuất từng file riêng lẻ. Hỗ trợ Word và PDF.', position: 'top' },
];

const STORAGE_KEY = 'taohoso_onboarding_done';

interface Props {
    page: 'bundle';
    forceShow?: boolean;
    onClose?: () => void;
}

export default function OnboardingTour({ page, forceShow, onClose }: Props) {
    const [currentStep, setCurrentStep] = useState(0);
    const [visible, setVisible] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

    const steps = page === 'bundle' ? BUNDLE_STEPS : [];

    useEffect(() => {
        if (forceShow) {
            setVisible(true);
            setCurrentStep(0);
            return;
        }
        const done = localStorage.getItem(STORAGE_KEY);
        if (!done) {
            // Show after a short delay for first-time users
            const timer = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [forceShow]);

    useEffect(() => {
        if (!visible || steps.length === 0) return;
        const step = steps[currentStep];
        const el = document.querySelector(step.target);
        if (el) {
            const rect = el.getBoundingClientRect();
            const pos = { top: 0, left: rect.left + rect.width / 2 - 150 };
            if (step.position === 'bottom') {
                pos.top = rect.bottom + 12;
            } else {
                pos.top = rect.top - 180;
            }
            // Clamp to viewport
            pos.left = Math.max(16, Math.min(pos.left, window.innerWidth - 320));
            pos.top = Math.max(16, pos.top);
            setTooltipPos(pos);
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentStep, visible, steps]);

    const handleClose = () => {
        setVisible(false);
        localStorage.setItem(STORAGE_KEY, 'true');
        onClose?.();
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    if (!visible || steps.length === 0) return null;

    const step = steps[currentStep];

    return (
        <>
            {/* Overlay */}
            <div onClick={handleClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                zIndex: 9998, cursor: 'pointer',
            }} />

            {/* Tooltip */}
            <div style={{
                position: 'fixed',
                top: tooltipPos.top,
                left: tooltipPos.left,
                width: 300,
                background: '#fff',
                borderRadius: 12,
                padding: '1rem 1.25rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                zIndex: 9999,
                animation: 'fadeIn 0.3s ease',
            }}>
                {/* Progress */}
                <div style={{ display: 'flex', gap: 4, marginBottom: '0.75rem' }}>
                    {steps.map((_, i) => (
                        <div key={i} style={{
                            flex: 1, height: 3, borderRadius: 2,
                            background: i <= currentStep ? '#0ea5e9' : '#e2e8f0',
                            transition: 'background 0.3s',
                        }} />
                    ))}
                </div>

                <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.95rem', color: '#1e293b' }}>
                    {step.title}
                </h4>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                    {step.content}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        {currentStep + 1}/{steps.length}
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={handleClose} style={skipBtnStyle}>Bỏ qua</button>
                        {currentStep > 0 && (
                            <button onClick={handlePrev} style={navBtnStyle}>← Trước</button>
                        )}
                        <button onClick={handleNext} style={primaryBtnStyle}>
                            {currentStep < steps.length - 1 ? 'Tiếp →' : '✅ Hoàn tất'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

const skipBtnStyle: React.CSSProperties = {
    background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.75rem',
    cursor: 'pointer', padding: '0.3rem 0.5rem',
};
const navBtnStyle: React.CSSProperties = {
    background: '#f1f5f9', border: 'none', borderRadius: 6, fontSize: '0.75rem',
    cursor: 'pointer', padding: '0.3rem 0.6rem', color: '#475569',
};
const primaryBtnStyle: React.CSSProperties = {
    background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6,
    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: '0.3rem 0.8rem',
};
