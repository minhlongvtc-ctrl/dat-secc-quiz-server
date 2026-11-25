# DAT Group Smart Factory Quiz Server — Khoa Kỹ thuật Điện tử 2, Học viện Công nghệ Bưu chính Viễn thông cơ sở TP.HCM (PTIT HCM)

Dự án Node.js + Express cho phép sinh viên quét mã QR vào **phòng chờ đồng bộ**, nhập **Họ tên & MSSV**, chờ Ban Tổ Chức bấm **"Bắt đầu thử thách"** để đồng loạt trả lời 10 câu hỏi trắc nghiệm (tự động chuyển câu khi hết 20s, hỗ trợ nút **"Hoàn thành"** hoặc tự nộp bài ở câu cuối) và tự động xếp hạng theo **Điểm số → Số câu đúng → Tốc độ trả lời**.

---

## 1. Triển khai lên Internet miễn phí bằng GitHub + Render (Khuyên dùng)

Cách này giúp sinh viên dùng **4G/5G hoặc bất kỳ mạng Wi-Fi nào** đều quét QR tham gia được mà không cần mở tunnel trên máy tính.

1. Tạo một repository mới (trống, không tích thêm README/.gitignore) trên GitHub: https://github.com/new
2. Mở Terminal trong thư mục `dat-secc-quiz-server` và đẩy code lên GitHub:
   ```bash
   git init -b main
   git add .
   git commit -m "Update quiz for PTIT HCM with waiting room and auto-advance"
   git remote add origin https://github.com/<username>/<ten-repo>.git
   git push -u origin main
   ```
3. Truy cập https://dashboard.render.com và đăng nhập bằng tài khoản **GitHub**.
4. Chọn **New +** → **Blueprint** (hoặc **Web Service**) → chọn repository vừa tạo. Render sẽ tự đọc file `render.yaml` và cài đặt/khởi chạy tự động.
5. Sau 1–2 phút khi trạng thái báo **Live**, mở link `https://<ten-app>.onrender.com/host` để chiếu lên màn hình hội trường:
   - Mã QR tự động nhận diện domain `https://<ten-app>.onrender.com/play` cho tất cả sinh viên.
   - Sinh viên quét QR vào phòng chờ; khi đủ số lượng, Host bấm **"Bắt đầu thử thách"** để cả phòng cùng làm bài.

> **Lưu ý khi dùng Render gói Free:**
> - Gói Free sẽ tự tạm nghỉ nếu **không có truy cập trong 15 phút**. Trước giờ tổ chức quiz **1–2 phút**, hãy mở sẵn trang `/host` (trang `/host` tự gửi request định kỳ nên server sẽ **luôn thức suốt buổi**).
> - Sau khi kết thúc mini game, hãy bấm **Xuất CSV (Excel)** ngay trên màn hình Host để tải bảng kết quả về máy, vì ổ đĩa trên gói Free không lưu vĩnh viễn file `data/results.json` khi server restart.

---

## 2. Chạy trực tiếp dưới Local (VS Code)

### Yêu cầu môi trường
- **Node.js (LTS >= 18)** từ https://nodejs.org
- **Visual Studio Code**

### Các bước chạy
1. Mở thư mục `dat-secc-quiz-server` bằng VS Code (`File → Open Folder`).
2. Mở Terminal trong VS Code (`Ctrl + \``) và chạy:
   ```bash
   npm install
   npm start
   ```
   *(Nếu PowerShell trên Windows chặn `npm.ps1`, hãy chạy `npm.cmd install` và `npm.cmd start`, hoặc `node server.js`.)*
3. Mở trình duyệt vào trang điều khiển (chiếu lên màn hình):
   - **http://localhost:3000/host**
4. Nếu sinh viên và máy tính dùng **chung một mạng Wi-Fi**, mã QR mặc định đã tự trỏ về IP LAN (Wi-Fi) của máy tính.

---

## 3. Phương án dự phòng: VS Code Port Forwarding (Chạy từ máy cá nhân cho 4G/5G)

1. Ở thanh dưới cùng của VS Code, chọn tab **PORTS** (cạnh Terminal).
2. Nhấn **Forward a Port** → nhập `3000` → Enter (đăng nhập GitHub/Microsoft nếu VS Code yêu cầu).
3. Nhấn chuột phải vào dòng Port `3000` → **Port Visibility → Public**.
4. Copy địa chỉ **Forwarded Address** (dạng `https://xxxx-3000.asse.devtunnels.ms`).
5. Dán link đó vào ô **Đổi link QR** trên màn hình Host (`/host`) → bấm **Đổi link QR**, chờ sinh viên vào phòng chờ rồi bấm **Bắt đầu thử thách**.
