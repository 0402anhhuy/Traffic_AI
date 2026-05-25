// ========================================================
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
// 4. API CALLS: UPLOAD & NHẬN DIỆN FILE
// ========================================================
function handleFile(file) {
    const loader = document.getElementById("detect-loader");
    const loaderText = document.getElementById("loader-text");
    const loaderSubtext = document.getElementById("loader-subtext");
    const progressContainer = document.getElementById("progress-container");
    const progressBar = document.getElementById("progress-bar");
    const conf = document.getElementById("conf-threshold").value;
    const duration = document.getElementById("video-duration")
        ? document.getElementById("video-duration").value
        : 15;

    // Reset progress UI
    progressContainer.style.display = "none";
    progressBar.style.width = "0%";
    loaderSubtext.innerText = "Vui lòng chờ trong giây lát";

    displayInputFile(file);

    loaderText.innerText = file.type.startsWith("video/")
        ? "Đang phân tích Video (Trích xuất các khung hình)..."
        : "Đang nhận diện phương tiện giao thông...";

    loader.classList.add("active");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("confidence_threshold", conf);
    formData.append("video_duration", duration);

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
            if (data.success) {
                if (data.type === "video_task") {
                    pollVideoTask(data.task_id);
                } else {
                    loader.classList.remove("active");
                    displayResult(data);
                    showToast("Xử lý file thành công!");
                }
            } else {
                loader.classList.remove("active");
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
        showToast("Vui lòng nhập Link YouTube!", "error");
        return;
    }

    if (!urlInput.includes("youtube.com") && !urlInput.includes("youtu.be")) {
        showToast("Chỉ hỗ trợ xử lý Link YouTube!", "error");
        return;
    }

    const loader = document.getElementById("detect-loader");
    const loaderText = document.getElementById("loader-text");
    const loaderSubtext = document.getElementById("loader-subtext");
    const progressContainer = document.getElementById("progress-container");
    const progressBar = document.getElementById("progress-bar");
    const conf = document.getElementById("conf-threshold").value;
    const duration = document.getElementById("video-duration")
        ? document.getElementById("video-duration").value
        : 15;

    // Reset progress UI
    progressContainer.style.display = "none";
    progressBar.style.width = "0%";
    loaderSubtext.innerText = "Vui lòng chờ trong giây lát";

    displayInputUrl(urlInput);

    loaderText.innerText =
        "Đang trích xuất luồng stream YouTube bằng yt-dlp...";

    loader.classList.add("active");

    fetch(`${BACKEND_URL}/detect/url`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            url: urlInput,
            confidence_threshold: conf,
            video_duration: duration,
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
            if (data.success) {
                if (data.type === "video_task") {
                    pollVideoTask(data.task_id);
                } else {
                    loader.classList.remove("active");
                    displayResult(data);
                    showToast("Nhận diện từ Link thành công!");
                }
            } else {
                loader.classList.remove("active");
                showToast("Xử lý thất bại!", "error");
            }
        })
        .catch((err) => {
            loader.classList.remove("active");
            showToast(err.message, "error");
        });
}

// ========================================================
// 5.5. POLLING TIẾN TRÌNH XỬ LÝ VIDEO
// ========================================================
function pollVideoTask(taskId) {
    const loader = document.getElementById("detect-loader");
    const loaderText = document.getElementById("loader-text");
    const loaderSubtext = document.getElementById("loader-subtext");
    const progressContainer = document.getElementById("progress-container");
    const progressBar = document.getElementById("progress-bar");

    loaderText.innerText = "Đang xử lý Video nền bất đồng bộ...";
    loaderSubtext.innerText = "Chuẩn bị khởi tạo tiến trình...";
    progressContainer.style.display = "block";
    progressBar.style.width = "0%";
    loader.classList.add("active");

    const pollInterval = setInterval(() => {
        fetch(`${BACKEND_URL}/task/${taskId}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Lỗi khi kiểm tra trạng thái tác vụ!");
                }
                return res.json();
            })
            .then((task) => {
                if (task.status === "processing") {
                    loaderSubtext.innerText = `Đang nhận diện: Đã hoàn thành ${task.progress}%`;
                    progressBar.style.width = `${task.progress}%`;
                } else if (task.status === "completed") {
                    clearInterval(pollInterval);
                    loader.classList.remove("active");
                    progressContainer.style.display = "none";
                    progressBar.style.width = "0%";

                    // Hiển thị kết quả video
                    displayResult({
                        type: "video",
                        video_url: task.result,
                        counts: task.counts,
                        avg_score: task.avg_score
                    });
                    showToast("Xử lý Video thành công!");
                } else if (task.status === "failed") {
                    clearInterval(pollInterval);
                    loader.classList.remove("active");
                    progressContainer.style.display = "none";
                    showToast(
                        `Lỗi xử lý video: ${task.error || "Lỗi không xác định"}`,
                        "error",
                    );
                }
            })
            .catch((err) => {
                clearInterval(pollInterval);
                loader.classList.remove("active");
                progressContainer.style.display = "none";
                showToast(err.message, "error");
            });
    }, 1500);
}

// ========================================================
// 6. HIỂN THỊ KẾT QUẢ VÀ CẬP NHẬT BIẾN ĐẾM
// ========================================================
function displayResult(data) {
    const display = document.getElementById("display-area");
    display.innerHTML = ""; // Clear old content

    if (data.type === "image") {
        if (data.detections) {
            setupInteractiveCanvas(display, data.image, data.detections);
        } else {
            const img = document.createElement("img");
            img.src = data.image;
            display.appendChild(img);
        }
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

    // Cập nhật số lượng đếm và độ tự tin trung bình
    updateStatistics(data.counts, data.avg_score);
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

// 10. HI N TH` TNG TC CANVAS (INTERACTIVE VIEWER)

// ========================================================

function setupInteractiveCanvas(container, imageSrc, detections) {

    const canvas = document.createElement("canvas");

    canvas.style.width = "100%";

    canvas.style.height = "auto";

    canvas.style.display = "block";

    canvas.style.cursor = "crosshair";

    container.appendChild(canvas);

    

    const ctx = canvas.getContext("2d");

    

    const img = new Image();

    img.src = imageSrc;

    

    const CLASS_COLORS = {

        "car": "#3b82f6",

        "threewheel": "#f59e0b",

        "bus": "#10b981",

        "truck": "#ef4444",

        "motorbike": "#8b5cf6",

        "van": "#06b6d4"

    };

    

    let scaleX = 1;

    let scaleY = 1;

    let hoveredDetection = null;

    let mouseX = -1;

    let mouseY = -1;



    img.onload = () => {

        // Fix canvas internal resolution to match image

        canvas.width = img.width;

        canvas.height = img.height;

        

        scaleX = 1;

        scaleY = 1;

        

        draw();

    };



    function draw() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        

        // 1. Draw base image

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        

        // 2. Spotlight effect

        if (hoveredDetection) {

            ctx.fillStyle = "rgba(0, 0, 0, 0.75)";

            ctx.fillRect(0, 0, canvas.width, canvas.height);

            

            const [x1, y1, x2, y2] = hoveredDetection.box;

            const w = x2 - x1;

            const h = y2 - y1;

            

            // Re-draw the original patch to cut through the shadow

            ctx.drawImage(img, x1, y1, w, h, x1, y1, w, h);

            

            // Draw crosshairs

            ctx.beginPath();

            ctx.setLineDash([10, 10]);

            ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";

            ctx.lineWidth = 2;

            

            // Dc

            ctx.moveTo(mouseX, 0);

            ctx.lineTo(mouseX, canvas.height);

            // Ngang

            ctx.moveTo(0, mouseY);

            ctx.lineTo(canvas.width, mouseY);

            

            ctx.stroke();

            ctx.setLineDash([]);

        }

        

        // 3. Draw boxes

        detections.forEach(det => {

            const isHovered = (det === hoveredDetection);

            if (hoveredDetection && !isHovered) return; // Only draw hovered box when spotlight is active

            

            const [x1, y1, x2, y2] = det.box;

            const color = CLASS_COLORS[det.class_name] || "#ef4444";

            

            ctx.strokeStyle = color;

            ctx.lineWidth = isHovered ? 4 : 2;

            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

            

            // Draw Label

            const label = `${det.class_name} ${det.score.toFixed(2)}`;

            ctx.font = "bold 16px Inter, sans-serif";

            const textWidth = ctx.measureText(label).width;

            const textHeight = 16;

            const padding = 6;

            

            ctx.fillStyle = color;

            ctx.fillRect(x1, y1 - textHeight - padding * 2, textWidth + padding * 2, textHeight + padding * 2);

            

            ctx.fillStyle = "white";

            ctx.fillText(label, x1 + padding, y1 - padding);

        });

    }



    canvas.addEventListener("mousemove", (e) => {

        const rect = canvas.getBoundingClientRect();

        // Calculate logical coordinates relative to canvas internal resolution

        const scaleXRatio = canvas.width / rect.width;

        const scaleYRatio = canvas.height / rect.height;

        

        mouseX = (e.clientX - rect.left) * scaleXRatio;

        mouseY = (e.clientY - rect.top) * scaleYRatio;

        

        let found = null;

        let minArea = Infinity;

        

        detections.forEach(det => {

            const [x1, y1, x2, y2] = det.box;

            if (mouseX >= x1 && mouseX <= x2 && mouseY >= y1 && mouseY <= y2) {

                const area = (x2 - x1) * (y2 - y1);

                if (area < minArea) {

                    minArea = area;

                    found = det;

                }

            }

        });

        

        if (found !== hoveredDetection) {

            hoveredDetection = found;

            canvas.style.cursor = found ? "crosshair" : "default";

            draw();

        } else if (hoveredDetection) {

            // Need to continuously redraw to update crosshairs

            draw();

        }

    });



    canvas.addEventListener("mouseleave", () => {

        hoveredDetection = null;

        mouseX = -1;

        mouseY = -1;

        draw();

    });

}

