// Standalone contract preview rendered inside the wizard's live preview panel
import { ContractData } from '../../types';

interface ContractPreviewProps {
    data: ContractData;
    formatVND: (v: string) => string;
}

export default function ContractPreview({ data, formatVND }: ContractPreviewProps) {
    const TEMPLATE_TITLES: Record<string, string> = {
        'nha-nguyen-can': 'HỢP ĐỒNG THUÊ NHÀ NGUYÊN CĂN',
        'phong-tro': 'HỢP ĐỒNG THUÊ PHÒNG TRỌ',
        'van-phong': 'HỢP ĐỒNG THUÊ VĂN PHÒNG',
        'mat-bang': 'HỢP ĐỒNG THUÊ MẶT BẰNG KINH DOANH',
    };
    const templateTitle = TEMPLATE_TITLES[data.template] || 'HỢP ĐỒNG THUÊ NHÀ';

    const today = new Date();

    return (
        <>
            <h2>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h2>
            <h3>Độc lập — Tự do — Hạnh phúc</h3>
            <p style={{ textAlign: 'center', margin: '0.5rem 0' }}>———————</p>
            <h2 style={{ fontSize: '1.05rem', margin: '1rem 0 0.5rem' }}>{templateTitle}</h2>
            <p style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '0.82rem', marginBottom: '1rem' }}>
                Số: ......../{today.getFullYear()}/HĐTN
            </p>

            <p style={{ fontStyle: 'italic', fontSize: '0.82rem' }}>
                Hôm nay, ngày {today.getDate()} tháng {today.getMonth() + 1} năm {today.getFullYear()}, tại {data.propertyAddress || '...............'},
                chúng tôi gồm có:
            </p>

            <h4>BÊN CHO THUÊ (Bên A):</h4>
            <p>Họ và tên: <span className="contract-highlight">{data.landlordName || '...............'}</span></p>
            {data.landlordDob && <p>Ngày sinh: {data.landlordDob}</p>}
            <p>CCCD/CMND số: <span className="contract-highlight">{data.landlordId || '...'}</span>
                {data.landlordIdDate && <> — Ngày cấp: {data.landlordIdDate}</>}
                {data.landlordIdPlace && <> — Nơi cấp: {data.landlordIdPlace}</>}
            </p>
            <p>Địa chỉ thường trú: {data.landlordAddress || '...'}</p>
            <p>Điện thoại: {data.landlordPhone || '...'}</p>
            {data.landlordBank && <p>STK ngân hàng: {data.landlordBank} — {data.landlordBankName || ''}</p>}

            <h4>BÊN THUÊ (Bên B):</h4>
            <p>Họ và tên: <span className="contract-highlight">{data.tenantName || '...............'}</span></p>
            {data.tenantDob && <p>Ngày sinh: {data.tenantDob}</p>}
            <p>CCCD/CMND số: <span className="contract-highlight">{data.tenantId || '...'}</span>
                {data.tenantIdDate && <> — Ngày cấp: {data.tenantIdDate}</>}
                {data.tenantIdPlace && <> — Nơi cấp: {data.tenantIdPlace}</>}
            </p>
            <p>Địa chỉ thường trú: {data.tenantAddress || '...'}</p>
            <p>Điện thoại: {data.tenantPhone || '...'}</p>

            <p style={{ fontStyle: 'italic', margin: '0.75rem 0', fontSize: '0.82rem' }}>
                Hai bên thỏa thuận ký kết hợp đồng thuê nhà với các điều khoản sau:
            </p>

            <h4>Điều 1: Đối tượng hợp đồng</h4>
            <p>Bên A đồng ý cho Bên B thuê và Bên B đồng ý thuê:</p>
            <p>• Địa chỉ: <span className="contract-highlight">{data.propertyAddress || '...'}</span></p>
            <p>• Diện tích: {data.propertyArea || '...'} m²</p>
            {data.propertyFloors && <p>• Số tầng: {data.propertyFloors}</p>}
            {data.propertyRooms && <p>• Số phòng: {data.propertyRooms}</p>}
            <p>• Mục đích sử dụng: {data.purpose}</p>
            {data.propertyDescription && <p>• Tình trạng: {data.propertyDescription}</p>}
            {data.propertyEquipment && <p>• Trang thiết bị: {data.propertyEquipment}</p>}

            <h4>Điều 2: Giá thuê và phương thức thanh toán</h4>
            <p>• Giá thuê: <span className="contract-highlight">{formatVND(data.rentAmount)}</span>/tháng
                {data.rentAmountWords && <> ({data.rentAmountWords})</>}
            </p>
            <p>• Tiền đặt cọc: {formatVND(data.depositAmount)}
                {data.depositAmountWords && <> ({data.depositAmountWords})</>}
            </p>
            <p>• Thanh toán: {data.paymentMethod}, trước ngày {data.paymentDay || '05'} mỗi tháng</p>
            <p>• Tiền đặt cọc được hoàn trả khi Bên B trả nhà đúng hạn và không vi phạm hợp đồng</p>
            {(data.electricRate || data.waterRate) && (
                <>
                    <p style={{ fontWeight: 500, marginTop: '0.25rem' }}>Chi phí khác:</p>
                    {data.electricRate && <p>• Tiền điện: {Number(data.electricRate).toLocaleString('vi-VN')} VND/kWh</p>}
                    {data.waterRate && <p>• Tiền nước: {Number(data.waterRate).toLocaleString('vi-VN')} VND/m³</p>}
                    {data.internetCost && <p>• Internet: {Number(data.internetCost).toLocaleString('vi-VN')} VND/tháng</p>}
                    {data.otherCosts && <p>• Khác: {data.otherCosts}</p>}
                </>
            )}

            <h4>Điều 3: Thời hạn thuê</h4>
            <p>• Thời hạn: {data.leaseDuration || '12'} tháng</p>
            <p>• Từ ngày: {data.startDate || '...'} đến ngày: {data.endDate || '...'}</p>
            <p>• Hết hạn, nếu Bên B có nhu cầu tiếp tục thuê thì phải thông báo cho Bên A trước ít nhất 02 tháng</p>

            <h4>Điều 4: Quyền và nghĩa vụ của Bên A</h4>
            <p>4.1. Giao nhà cho Bên B đúng thời gian và tình trạng đã thỏa thuận</p>
            <p>4.2. Đảm bảo quyền sử dụng nhà hợp pháp, ổn định cho Bên B trong suốt thời hạn hợp đồng</p>
            <p>4.3. Bảo dưỡng, sửa chữa nhà định kỳ hoặc theo thỏa thuận (trừ hư hỏng do Bên B gây ra)</p>
            <p>4.4. Hỗ trợ Bên B đăng ký tạm trú tại địa chỉ thuê</p>
            <p>4.5. Không tăng giá thuê trong thời hạn hợp đồng</p>
            <p>4.6. Không đơn phương chấm dứt HĐ nếu Bên B thực hiện đúng nghĩa vụ</p>
            <p>4.7. Thực hiện nghĩa vụ tài chính với Nhà nước theo quy định pháp luật</p>

            <h4>Điều 5: Quyền và nghĩa vụ của Bên B</h4>
            <p>5.1. Sử dụng nhà đúng mục đích đã thỏa thuận ({data.purpose})</p>
            <p>5.2. Thanh toán đầy đủ tiền thuê và các chi phí khác đúng hạn</p>
            <p>5.3. Giữ gìn, bảo quản nhà và trang thiết bị; bồi thường nếu làm hư hỏng</p>
            <p>5.4. Không được tự ý sửa chữa, cải tạo, thay đổi kết cấu khi chưa có sự đồng ý bằng văn bản của Bên A</p>
            <p>5.5. Không được cho thuê lại, chuyển nhượng HĐ khi chưa có sự đồng ý của Bên A</p>
            <p>5.6. Tuân thủ quy định pháp luật, nội quy khu dân cư, giữ gìn vệ sinh và trật tự</p>
            <p>5.7. Trả lại nhà khi hết hạn hoặc chấm dứt HĐ đúng tình trạng ban đầu (trừ hao mòn tự nhiên)</p>

            <h4>Điều 6: Chấm dứt hợp đồng</h4>
            <p>6.1. Hợp đồng chấm dứt khi hết thời hạn mà không gia hạn</p>
            <p>6.2. Một bên muốn chấm dứt trước hạn phải thông báo bằng văn bản trước ít nhất {data.noticePeriod || '30'} ngày</p>
            <p>6.3. Bên A được đơn phương chấm dứt nếu Bên B: không trả tiền thuê quá 30 ngày, sử dụng sai mục đích, vi phạm pháp luật, hoặc gây thiệt hại nghiêm trọng</p>
            <p>6.4. Bên vi phạm phải bồi thường thiệt hại cho bên còn lại</p>
            <p>6.5. Khi chấm dứt HĐ, hai bên lập biên bản bàn giao nhà và thanh lý hợp đồng</p>

            <h4>Điều 7: Điều khoản chung</h4>
            <p>7.1. Hai bên cam kết thực hiện đúng các điều khoản đã thỏa thuận</p>
            <p>7.2. Mọi tranh chấp phát sinh được giải quyết thông qua thương lượng; nếu không thống nhất sẽ đưa ra Tòa án nhân dân có thẩm quyền</p>
            <p>7.3. Mọi sửa đổi, bổ sung phải được lập thành phụ lục hợp đồng bằng văn bản có chữ ký của hai bên</p>
            <p>7.4. Hợp đồng được lập thành 02 bản, mỗi bên giữ 01 bản, có giá trị pháp lý như nhau</p>
            <p>7.5. Hợp đồng có hiệu lực kể từ ngày {data.startDate || '...'}</p>

            {data.additionalTerms && (
                <>
                    <h4>Điều khoản bổ sung</h4>
                    <p>{data.additionalTerms}</p>
                </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', textAlign: 'center' }}>
                <div>
                    <p style={{ fontWeight: 600 }}>BÊN CHO THUÊ (Bên A)</p>
                    <p style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-muted)' }}>(Ký và ghi rõ họ tên)</p>
                </div>
                <div>
                    <p style={{ fontWeight: 600 }}>BÊN THUÊ (Bên B)</p>
                    <p style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-muted)' }}>(Ký và ghi rõ họ tên)</p>
                </div>
            </div>
        </>
    );
}
