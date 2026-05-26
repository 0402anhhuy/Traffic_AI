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
        car: "#3b82f6",
        threewheel: "#f59e0b",
        bus: "#10b981",
        truck: "#ef4444",
        motorbike: "#8b5cf6",
        van: "#06b6d4",
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
        detections.forEach((det) => {
            const isHovered = det === hoveredDetection;

            if (hoveredDetection && !isHovered) return; // Only draw hovered box when spotlight is active

            const [x1, y1, x2, y2] = det.box;
            const color = CLASS_COLORS[det.class_name] || "#ef4444";

            const base_size = Math.max(canvas.width, canvas.height);
            const scale = base_size / 800;

            ctx.strokeStyle = color;
            // Nét vẽ siêu mỏng: mặc định 1px, hover 2px (nhân với scale để bù trừ ảnh 4K)
            ctx.lineWidth = isHovered
                ? Math.max(2, 2 * scale)
                : Math.max(1, 1 * scale);
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

            // Draw Label
            const label = `${det.class_name} ${det.score.toFixed(2)}`;

            // Font siêu nhỏ để tránh đè chéo: khoảng 10px cho ảnh 800px
            const fontSize = Math.max(8, Math.floor(10 * scale));
            ctx.font = `600 ${fontSize}px Inter, sans-serif`; // Dùng 600 thay vì bold để chữ thanh thoát hơn

            const textWidth = ctx.measureText(label).width;
            const textHeight = fontSize;
            const padding = Math.max(2, Math.floor(3 * scale));

            // Tính toán tọa độ nền chữ (background)
            // Lùi background vào sát viền hơn
            ctx.fillStyle = color;
            ctx.fillRect(
                x1,
                y1 - textHeight - padding * 2,
                textWidth + padding * 2,
                textHeight + padding * 2,
            );

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

        detections.forEach((det) => {
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
