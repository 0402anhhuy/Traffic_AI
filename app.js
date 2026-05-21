// ========================================================
// 0. CẤU HÌNH LIÊN KẾT BACKEND TỰ ĐỘNG
// ========================================================
// Tự động nhận diện: Nếu chạy local thì gọi API local, nếu chạy trên Vercel thì gọi qua HF Space
const BACKEND_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:8000"
        : "https://anhhuy0402-video-ai-traffic.hf.space";

console.log("Traffic AI Backend URL connected at:", BACKEND_URL || "Local Server");

// ========================================================
// 1. CHUYỂN TABS CHỨC NĂNG
// ========================================================
function switchTab(tabId) {
    // Khử active tất cả các tab button
    document.querySelectorAll(".tab-btn").forEach((btn) => {
        // Không xóa nút "Xóa"
        if (btn.id !== "btn-clear") {
            btn.classList.remove("active");
        }
    });

    // Tìm nút click và kích hoạt
    event.currentTarget.classList.add("active");

    // Ẩn tất cả các nội dung tab
    document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
    });

    // Hiển thị nội dung tab được chọn
    document.getElementById(tabId).classList.add("active");
}

// ========================================================
// 2. HIỂN THỊ THÔNG BÁO (TOAST)
// ========================================================
function showToast(message, type = "success") {
    const toast = document.getElementById("toast-notification");
    const icon = document.getElementById("toast-icon");
    const msg = document.getElementById("toast-message");

    msg.innerText = message;

    toast.className = "toast"; // Reset
    if (type === "success") {
        toast.classList.add("active", "success");
        icon.className = "fa-solid fa-circle-check";
        icon.style.color = "var(--color-success)";
    } else {
        toast.classList.add("active", "error");
        icon.className = "fa-solid fa-circle-exclamation";
        icon.style.color = "var(--color-danger)";
    }

    setTimeout(() => {
        toast.classList.remove("active");
    }, 3500);
}

// ========================================================
// 3. DRAG AND DROP ZONE XỬ LÝ
// ========================================================
const dropzone = document.getElementById("dropzone");

["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(
        eventName,
        (e) => {
            e.preventDefault();
            dropzone.classList.add("dragover");
        },
        false,
    );
});

["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(
        eventName,
        (e) => {
            e.preventDefault();
            dropzone.classList.remove("dragover");
        },
        false,
    );
});

dropzone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

// ========================================================
// 4. API CALLS: UPLOAD & NHẬN DIỆN FILE
// ========================================================
function handleFile(file) {
    const loader = document.getElementById("detect-loader");
    const loaderText = document.getElementById("loader-text");
    const display = document.getElementById("display-area");
    const conf = document.getElementById("conf-threshold").value;

    loaderText.innerText = file.type.startsWith("video/")
        ? "Đang phân tích Video (Trích xuất các khung hình)..."
        : "Đang nhận diện phương tiện giao thông...";

    loader.classList.add("active");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("confidence_threshold", conf);

    fetch(`${BACKEND_URL}/detect/file`, {
        method: "POST",
        body: formData,
    })
        .then((res) => {
            if (!res.ok) {
                throw new Error("Lỗi máy chủ khi xử lý file!");
            }
            return res.json();
        })
        .then((data) => {
            loader.classList.remove("active");
            if (data.success) {
                displayResult(data);
                showToast("Xử lý file thành công!");
            } else {
                showToast(data.message || "Xử lý file thất bại", "error");
            }
        })
        .catch((err) => {
            loader.classList.remove("active");
            showToast(err.message, "error");
        });
}

// ========================================================
// 5. API CALLS: NHẬN DIỆN TỪ LINK URL
// ========================================================
function detectUrl() {
    const urlInput = document.getElementById("url-input").value.trim();
    if (!urlInput) {
        showToast(
            "Vui lòng nhập Link URL ảnh, video hoặc link YouTube!",
            "error",
        );
        return;
    }

    const loader = document.getElementById("detect-loader");
    const loaderText = document.getElementById("loader-text");
    const conf = document.getElementById("conf-threshold").value;

    loaderText.innerText =
        urlInput.includes("youtube.com") || urlInput.includes("youtu.be")
            ? "Đang trích xuất luồng stream YouTube bằng yt-dlp..."
            : "Đang phân tích Link URL...";

    loader.classList.add("active");

    fetch(`${BACKEND_URL}/detect/url`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            url: urlInput,
            confidence_threshold: conf,
        }),
    })
        .then((res) => {
            if (!res.ok) {
                return res.json().then((json) => {
                    throw new Error(json.detail || "Lỗi xử lý Link!");
                });
            }
            return res.json();
        })
        .then((data) => {
            loader.classList.remove("active");
            if (data.success) {
                displayResult(data);
                showToast("Nhận diện từ Link thành công!");
            } else {
                showToast("Xử lý thất bại!", "error");
            }
        })
        .catch((err) => {
            loader.classList.remove("active");
            showToast(err.message, "error");
        });
}

// ========================================================
// 6. HIỂN THỊ KẾT QUẢ VÀ CẬP NHẬT BIẾN ĐẾM
// ========================================================
function displayResult(data) {
    const display = document.getElementById("display-area");
    display.innerHTML = ""; // Clear old content

    if (data.type === "image") {
        const img = document.createElement("img");
        img.src = data.image;
        display.appendChild(img);
    } else if (data.type === "video") {
        const video = document.createElement("video");
        // Đảm bảo trỏ đúng link tuyệt đối đến máy chủ backend để stream video
        video.src = data.video_url.startsWith("http")
            ? data.video_url
            : `${BACKEND_URL}${data.video_url}`;
        video.controls = true;
        video.autoplay = true;
        video.loop = true;
        display.appendChild(video);
    }

    // Cập nhật số lượng đếm
    updateStatistics(data.counts);
}

// ========================================================
// 7. API CALLS: TẢI ĐỒ THỊ EDA
// ========================================================
function loadEda() {
    const btn = document.getElementById("btn-load-eda");
    const loader = document.getElementById("eda-loader");
    const wrapper = document.getElementById("eda-image-wrapper");

    btn.style.display = "none";
    loader.style.display = "flex";

    fetch(`${BACKEND_URL}/eda`, { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
            loader.style.display = "none";
            if (data.success) {
                wrapper.innerHTML = `<img src="${data.eda_image}" alt="EDA statistics Charts">`;
                wrapper.style.display = "flex";
                showToast("Đồ thị EDA đã được khởi tạo!");
            } else {
                btn.style.display = "block";
                showToast("Lỗi khi load EDA!", "error");
            }
        })
        .catch((err) => {
            loader.style.display = "none";
            btn.style.display = "block";
            showToast("Lỗi kết nối API!", "error");
        });
}

// ========================================================
// 8. API CALLS: TẢI ĐỒ THỊ ĐÁNH GIÁ (mAP / CONFUSION MATRIX)
// ========================================================
function loadEvaluation() {
    const btn = document.getElementById("btn-load-eval");
    const loader = document.getElementById("eval-loader");
    const wrapper = document.getElementById("eval-image-wrapper");
    const repoId = document.getElementById("hf-repo-input").value.trim();

    btn.style.display = "none";
    loader.style.display = "flex";

    fetch(`${BACKEND_URL}/evaluate?hf_repo_id=${encodeURIComponent(repoId)}`, {
        method: "POST",
    })
        .then((res) => res.json())
        .then((data) => {
            loader.style.display = "none";
            if (data.success) {
                wrapper.innerHTML = `<img src="${data.evaluation_image}" alt="Model Evaluation Dashboard">`;
                wrapper.style.display = "flex";
                showToast("Tính toán chỉ số và vẽ đồ thị mAP thành công!");
            } else {
                btn.style.display = "block";
                showToast("Lỗi đánh giá!", "error");
            }
        })
        .catch((err) => {
            loader.style.display = "none";
            btn.style.display = "block";
            showToast("Lỗi kết nối API!", "error");
        });
}

// ========================================================
// 9. API CALLS: CẤU HÌNH HUGGING FACE REPO
// ========================================================
function saveHfConfig() {
    const repoId = document.getElementById("hf-repo-input").value.trim();
    if (!repoId) {
        showToast("Vui lòng nhập Hugging Face Repository ID!", "error");
        return;
    }

    const btn = document.getElementById("btn-save-hf");
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang tải Model...`;

    fetch(`${BACKEND_URL}/config/hf`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ repo_id: repoId }),
    })
        .then((res) => {
            if (!res.ok) {
                return res.json().then((json) => {
                    throw new Error(json.detail || "Lỗi tải model!");
                });
            }
            return res.json();
        })
        .then((data) => {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> Tải Model`;
            if (data.success) {
                showToast(data.message);
            }
        })
        .catch((err) => {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> Tải Model`;
            showToast(err.message, "error");
        });
}

function updateStatistics(counts) {
    let total = 0;
    for (const key in counts) {
        const val = counts[key] || 0;
        document.getElementById(`count-${key}`).innerText = val;
        total += val;
    }
    document.getElementById("count-total").innerText = total;
}

function clearDisplay() {
    const display = document.getElementById("display-area");
    display.innerHTML = `
                <div class="empty-display">
                    <i class="fa-solid fa-images"></i>
                    <div>Chưa có dữ liệu. Vui lòng tải file hoặc dán link URL ở phía trên để bắt đầu.</div>
                </div>
            `;

    const dummyCounts = {
        car: 0,
        threewheel: 0,
        bus: 0,
        truck: 0,
        motorbike: 0,
        van: 0,
    };
    updateStatistics(dummyCounts);
    document.getElementById("url-input").value = "";
    showToast("Đã dọn dẹp màn hình hiển thị.");
}
