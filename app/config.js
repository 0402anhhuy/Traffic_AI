// 0. CẤU HÌNH LIÊN KẾT BACKEND TỰ ĐỘNG
// ========================================================
// Tự động nhận diện: Nếu chạy local thì gọi API local, nếu chạy trên Vercel thì gọi qua HF Space
const BACKEND_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:8000"
        : "https://anhhuy0402-traffic-ai-be.hf.space";

console.log(
    "Traffic AI Backend URL connected at:",
    BACKEND_URL || "Local Server",
);

// ========================================================
