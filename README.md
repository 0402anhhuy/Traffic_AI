# Traffic AI Hub - Frontend UI (Vercel)

Đây là mã nguồn Frontend (giao diện người dùng) của dự án **Traffic AI Hub**, được tối ưu hóa để triển khai tĩnh (Static Hosting) trên **Vercel**.

## 🎨 Giao diện & Tính năng chính
- **Premium Light Theme Glassmorphism**: Phong cách tối giản sang trọng, hiệu ứng kính mờ trắng, tương thích mọi loại màn hình.
- **Vùng Kéo Thả Tiện Lợi (Drag & Drop)**: Hỗ trợ phân tích cả hình ảnh và video nhanh chóng.
- **Smart URL Input**: Phân tích link ảnh trực tiếp, luồng video trực tiếp, đặc biệt hỗ trợ trích xuất luồng video YouTube (qua backend).
- **Interactive Dashboards**: Tích hợp các biểu đồ phân tích EDA, biểu đồ đánh giá mAP của mô hình Faster R-CNN trực tiếp trên giao diện.

## 🔗 Liên kết API Backend
Frontend tự động phát hiện môi trường chạy:
- Nếu chạy **local** (ở hostname `localhost` hoặc `127.0.0.1`), giao diện sẽ gửi request đến FastAPI cục bộ chạy tại `http://127.0.0.1:8000`.
- Nếu chạy **online** (trên tên miền của Vercel), giao diện sẽ gửi request trực tiếp đến API Backend triển khai trên **Hugging Face Spaces** tại URL: `https://anhhuy0402-video-ai-traffic.hf.space`.

Để thay đổi URL Backend online, bạn chỉ cần mở file [app.js](file:///d:/AnhHuy/Code/Project/Traffic_AI/Traffic_AI_UI/app.js) và sửa lại hằng số `BACKEND_URL`.

## 🚀 Hướng dẫn Triển khai lên Vercel

1. **Khởi tạo kho chứa Git riêng (UI Git Repository)**:
   ```bash
   cd Traffic_AI_UI
   git init
   git add .
   git commit -m "Initialize Frontend UI"
   ```

2. **Đẩy lên GitHub cá nhân**:
   - Tạo một repository mới trên GitHub (ví dụ: `Traffic_AI_UI`).
   - Liên kết và push code lên:
     ```bash
     git remote add origin https://github.com/<username>/Traffic_AI_UI.git
     git branch -M main
     git push -u origin main
     ```

3. **Deploy Vercel**:
   - Đăng nhập vào [Vercel Console](https://vercel.com).
   - Click **Add New** -> **Project**.
   - Import repo `Traffic_AI_UI` từ GitHub.
   - Nhấn **Deploy** (không cần cấu hình build command vì đây là dự án HTML/CSS/JS tĩnh). Vercel sẽ tự động deploy và cấp cho bạn một tên miền miễn phí dạng `*.vercel.app`.
