// 1. CHUYỂN TABS CHỨC NĂNG
// ========================================================
function switchTab(tabId) {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
        if (btn.id !== "btn-clear") {
            btn.classList.remove("active");
        }
    });

    event.currentTarget.classList.add("active");

    document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
    });

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

// Lắng nghe sự kiện Paste (Ctrl + V) ảnh trực tiếp
document.addEventListener("paste", (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            // Đảm bảo người dùng đang ở Tab Nhận diện thì mới xử lý
            const detectTab = document.getElementById("detect-tab");
            if (detectTab && detectTab.classList.contains("active")) {
                handleFile(file);
                e.preventDefault();
                break;
            }
        }
    }
});

// ========================================================
function updateStatistics(counts, avgScore = 0) {
    let total = 0;
    for (const key in counts) {
        const val = counts[key] || 0;
        document.getElementById(`count-${key}`).innerText = val;
        total += val;
    }
    document.getElementById("count-total").innerText = total;

    // Cập nhật độ tự tin trung bình
    const scorePct = (avgScore * 100).toFixed(1);
    document.getElementById("avg-confidence").innerText = `${scorePct}%`;
}

function clearDisplay() {
    const display = document.getElementById("display-area");
    display.innerHTML = `
                <div class="empty-display">
                    <i class="fa-solid fa-images"></i>
                    <div>Chưa có kết quả nhận diện.</div>
                </div>
            `;

    const inputDisplay = document.getElementById("input-display-area");
    if (inputDisplay) {
        inputDisplay.innerHTML = `
                <div class="empty-display">
                    <i class="fa-solid fa-images"></i>
                    <div>Chưa có dữ liệu. Vui lòng tải file hoặc dán link URL.</div>
                </div>
            `;
    }

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

function displayInputFile(file) {
    const inputDisplay = document.getElementById("input-display-area");
    if (!inputDisplay) return;
    inputDisplay.innerHTML = "";

    if (file.type.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        inputDisplay.appendChild(img);
    } else if (file.type.startsWith("video/")) {
        const video = document.createElement("video");
        video.src = URL.createObjectURL(file);
        video.controls = true;
        video.autoplay = true;
        video.loop = true;
        inputDisplay.appendChild(video);
    }
}

function displayInputUrl(url) {
    const inputDisplay = document.getElementById("input-display-area");
    if (!inputDisplay) return;
    inputDisplay.innerHTML = `
        <div class="empty-display">
            <i class="fa-solid fa-link"></i>
            <div style="margin-top: 10px; word-break: break-all;">
                <strong>Đầu vào từ Link URL:</strong><br><br>
                <a href="${url}" target="_blank" style="color: var(--color-primary);">${url}</a>
            </div>
        </div>
    `;
}
// ========================================================

