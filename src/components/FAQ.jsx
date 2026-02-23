import { useState } from 'react';

const faqData = [
    {
        q: 'Tờ khai CT01 là gì?',
        a: 'Tờ khai CT01 là mẫu tờ khai thay đổi thông tin cư trú theo Thông tư 55/2021/TT-BCA, dùng để đăng ký tạm trú hoặc thường trú tại địa chỉ mới.'
    },
    {
        q: 'Làm sao để đăng ký tạm trú online?',
        a: 'Bạn cần điền tờ khai CT01, chuẩn bị hợp đồng thuê nhà/ở nhờ, sổ hồng, sau đó nộp hồ sơ qua Cổng dịch vụ công quốc gia tại dichvucong.dancuquocgia.gov.vn'
    },
    {
        q: 'Đăng ký thường trú cần những giấy tờ gì?',
        a: 'Cần tờ khai CT01, giấy tờ chứng minh chỗ ở hợp pháp (sổ hồng/sổ đỏ), CCCD. Nếu đăng ký cho nhiều người cần thêm giấy tờ chứng minh quan hệ như giấy kết hôn, giấy khai sinh.'
    },
    {
        q: 'CT07 là gì và dùng để làm gì?',
        a: 'CT07 là giấy xác nhận thông tin cư trú, dùng để chứng minh nơi đăng ký cư trú của công dân. Thường dùng khi làm thủ tục hành chính, vay vốn ngân hàng, xin visa.'
    },
    {
        q: 'Tạm trú được bao lâu có CT07?',
        a: 'Sau khi đăng ký tạm trú thành công, bạn có thể xin CT07 ngay. Thời gian xử lý thông thường là 3-5 ngày làm việc khi nộp qua Cổng dịch vụ công.'
    },
    {
        q: 'Tạm trú và thường trú khác nhau gì?',
        a: 'Tạm trú là đăng ký cư trú tại nơi không phải hộ khẩu thường trú, có thời hạn (thông thường 2 năm, có thể gia hạn). Thường trú là đăng ký cư trú cố định, không giới hạn thời gian, gắn với địa chỉ hộ khẩu.'
    },
    {
        q: 'Chi phí sang tên sổ hồng bao nhiêu?',
        a: 'Chi phí sang tên sổ hồng bao gồm: phí công chứng (0.1-0.5% giá trị), lệ phí trước bạ (0.5%), thuế TNCN (2% nếu bán/cho dưới 5 năm). Tổng chi phí phụ thuộc giá trị bất động sản và tỉnh/thành phố.'
    },
    {
        q: 'CT07 và CT08 khác nhau như thế nào?',
        a: 'CT07 là giấy xác nhận thông tin cư trú do công dân yêu cầu. CT08 là thông báo kết quả giải quyết đăng ký cư trú do Công an cấp xã/phường ban hành sau khi hoàn tất thủ tục, có giá trị 1 năm, thay thế sổ hộ khẩu cũ.'
    }
];

export default function FAQ() {
    const [activeIndex, setActiveIndex] = useState(null);

    const toggle = (i) => setActiveIndex(activeIndex === i ? null : i);

    return (
        <div className="faq-list">
            {faqData.map((item, i) => (
                <div key={i} className={`faq-item ${activeIndex === i ? 'active' : ''}`}>
                    <button className="faq-question" onClick={() => toggle(i)}>
                        {item.q}
                        <span className="faq-icon">+</span>
                    </button>
                    <div className="faq-answer">
                        <div className="faq-answer-inner">{item.a}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
