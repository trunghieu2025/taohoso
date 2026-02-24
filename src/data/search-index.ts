import { removeTones } from '../utils/remove-vietnamese-tones';

// Static search index — update when content changes
const items = [
    // Guide pages
    {
        title: 'Hướng dẫn đăng ký tạm trú',
        url: '/huong-dan/tam-tru',
        content: 'Quy trình đăng ký tạm trú online, hồ sơ cần thiết, tờ khai CT01, hợp đồng thuê nhà, cổng dịch vụ công quốc gia, gia hạn tạm trú',
        type: 'guide',
    },
    {
        title: 'Hướng dẫn đăng ký thường trú',
        url: '/huong-dan/thuong-tru',
        content: 'Đăng ký thường trú hộ khẩu, điều kiện nhập hộ tách hộ, giấy tờ chứng minh chỗ ở, sổ hồng sổ đỏ, CCCD',
        type: 'guide',
    },
    {
        title: 'Hướng dẫn xin giấy xác nhận cư trú CT07',
        url: '/huong-dan/ct07',
        content: 'CT07 giấy xác nhận thông tin cư trú, xin CT07 online offline, dùng để làm gì vay ngân hàng xin visa',
        type: 'guide',
    },
    {
        title: 'Hướng dẫn sang tên sổ hồng',
        url: '/huong-dan/sang-ten-so-hong',
        content: 'Thủ tục sang tên sổ hồng sổ đỏ, phí trước bạ, thuế TNCN, công chứng, máy tính chi phí sang tên bất động sản',
        type: 'guide',
    },
    // Tools
    {
        title: 'Tạo hợp đồng thuê nhà',
        url: '/hop-dong-thue-nha',
        content: 'Soạn hợp đồng thuê nhà phòng trọ văn phòng mặt bằng, xuất PDF, bên cho thuê bên thuê, tiền cọc giá thuê điều khoản',
        type: 'tool',
    },
    {
        title: 'Điền tờ khai CT01',
        url: '/dien-form-ct01',
        content: 'Điền mẫu tờ khai CT01 thay đổi thông tin cư trú, xuất PDF nộp công an, đăng ký tạm trú thường trú tách hộ nhập hộ',
        type: 'tool',
    },
    // FAQ items
    {
        title: 'Tờ khai CT01 là gì?',
        url: '/#faq',
        content: 'Tờ khai CT01 là mẫu tờ khai thay đổi thông tin cư trú theo Thông tư 55/2021/TT-BCA, dùng để đăng ký tạm trú hoặc thường trú tại địa chỉ mới',
        type: 'faq',
    },
    {
        title: 'Làm sao để đăng ký tạm trú online?',
        url: '/#faq',
        content: 'Điền tờ khai CT01, chuẩn bị hợp đồng thuê nhà ở nhờ, sổ hồng, nộp hồ sơ qua cổng dịch vụ công quốc gia dichvucong.dancuquocgia.gov.vn',
        type: 'faq',
    },
    {
        title: 'Đăng ký thường trú cần những giấy tờ gì?',
        url: '/#faq',
        content: 'Tờ khai CT01, giấy tờ chứng minh chỗ ở hợp pháp sổ hồng sổ đỏ, CCCD, giấy kết hôn giấy khai sinh nếu đăng ký cho nhiều người',
        type: 'faq',
    },
    {
        title: 'CT07 là gì và dùng để làm gì?',
        url: '/#faq',
        content: 'CT07 giấy xác nhận thông tin cư trú, chứng minh nơi đăng ký cư trú, dùng khi làm thủ tục hành chính vay vốn ngân hàng xin visa',
        type: 'faq',
    },
    {
        title: 'Tạm trú và thường trú khác nhau gì?',
        url: '/#faq',
        content: 'Tạm trú đăng ký cư trú tạm thời có thời hạn 2 năm gia hạn. Thường trú đăng ký cố định không giới hạn thời gian gắn với hộ khẩu',
        type: 'faq',
    },
    {
        title: 'Chi phí sang tên sổ hồng bao nhiêu?',
        url: '/#faq',
        content: 'Phí công chứng 0.1 đến 0.5 phần trăm, lệ phí trước bạ 0.5 phần trăm, thuế TNCN 2 phần trăm khi bán cho dưới 5 năm, tính theo giá trị bất động sản',
        type: 'faq',
    },
    {
        title: 'CT07 và CT08 khác nhau như thế nào?',
        url: '/#faq',
        content: 'CT07 giấy xác nhận thông tin cư trú do công dân yêu cầu. CT08 thông báo kết quả giải quyết đăng ký cư trú do công an cấp xã phường ban hành, có giá trị 1 năm thay thế sổ hộ khẩu cũ',
        type: 'faq',
    },
];

// Pre-compute searchText from title + content for fast client-side matching
export const searchIndex = items.map(item => ({
    ...item,
    searchText: removeTones(item.title + ' ' + item.content),
}));
