let chartInstance = null;
let currentMode = "draw";
let isDrawing = false;

const canvas = document.getElementById("digitCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

window.onload = () => {
    clearCanvas();
    initProbBars();
};

function initProbBars() {
    const container = document.getElementById("probBarsContainer");
    container.innerHTML = "";
    for (let i = 0; i < 10; i++) {
        container.innerHTML += `
            <div class="flex items-center gap-3 text-xs">
                <span class="w-4 font-mono font-bold text-slate-400">${i}</span>
                <div class="flex-1 bg-slate-900 rounded-full h-3.5 overflow-hidden border border-slate-700/60 p-[1px]">
                    <div id="bar-${i}" class="bg-blue-600 h-full rounded-full transition-all duration-150" style="width: 0%"></div>
                </div>
                <span id="label-${i}" class="w-12 text-right font-mono text-slate-400">0.0%</span>
            </div>
        `;
    }
}

function setMode(mode) {
    currentMode = mode;
}

function clearCanvas() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 28, 28);
    resetBars();
}

function getPixelCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: Math.floor((e.clientX - rect.left) * scaleX),
        y: Math.floor((e.clientY - rect.top) * scaleY)
    };
}

function drawPixel(e) {
    if (!isDrawing) return;
    const { x, y } = getPixelCoords(e);

    ctx.fillStyle = currentMode === "draw" ? "white" : "black";
    // 2x2 fırça kalınlığı el yazısı formuna daha uygundur
    ctx.fillRect(x, y, 2, 2);

    sendPrediction();
}

canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    drawPixel(e);
});

canvas.addEventListener("mousemove", drawPixel);
window.addEventListener("mouseup", () => { isDrawing = false; });

canvas.addEventListener("touchstart", (e) => {
    isDrawing = true;
    const touch = e.touches[0];
    drawPixel({ clientX: touch.clientX, clientY: touch.clientY });
    e.preventDefault();
});
canvas.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    drawPixel({ clientX: touch.clientX, clientY: touch.clientY });
    e.preventDefault();
});
window.addEventListener("touchend", () => { isDrawing = false; });

// 0-9 El Yazısı Formuna Uygun Kalın (3px) Şablonlar
function loadSelectedDigit() {
    clearCanvas();
    const digit = document.getElementById("digitSelector").value;
    ctx.fillStyle = "white";

    switch (digit) {
        case "0":
            ctx.fillRect(8, 4, 12, 3);
            ctx.fillRect(8, 21, 12, 3);
            ctx.fillRect(6, 6, 3, 16);
            ctx.fillRect(19, 6, 3, 16);
            break;

        case "1":
            ctx.fillRect(13, 4, 3, 19);
            ctx.fillRect(10, 6, 3, 3);
            ctx.fillRect(9, 21, 11, 3);
            break;

        case "2":
            // Üst kavis
            ctx.fillRect(8, 4, 11, 3);
            ctx.fillRect(17, 6, 3, 5);
            // Çapraz/orta gövde
            ctx.fillRect(13, 10, 5, 3);
            ctx.fillRect(9, 13, 5, 3);
            ctx.fillRect(7, 16, 4, 5);
            // Alt taban
            ctx.fillRect(7, 21, 14, 3);
            break;

        case "3":
            ctx.fillRect(8, 4, 11, 3);
            ctx.fillRect(17, 6, 3, 6);
            ctx.fillRect(10, 12, 9, 3);
            ctx.fillRect(17, 15, 3, 6);
            ctx.fillRect(8, 21, 11, 3);
            break;

        case "4":
            ctx.fillRect(7, 4, 3, 11);
            ctx.fillRect(7, 13, 14, 3);
            ctx.fillRect(16, 4, 3, 20);
            break;

        case "5":
            // Üst şapka ve sol dikme
            ctx.fillRect(7, 4, 13, 3);
            ctx.fillRect(7, 6, 3, 7);
            // Orta bel ve alt göbek
            ctx.fillRect(7, 11, 11, 3);
            ctx.fillRect(17, 13, 3, 8);
            ctx.fillRect(7, 21, 11, 3);
            break;

        case "6":
            ctx.fillRect(9, 4, 10, 3);
            ctx.fillRect(7, 6, 3, 16);
            ctx.fillRect(9, 12, 10, 3);
            ctx.fillRect(17, 14, 3, 7);
            ctx.fillRect(9, 21, 9, 3);
            break;

        case "7":
            ctx.fillRect(7, 4, 14, 3);
            ctx.fillRect(17, 7, 3, 5);
            ctx.fillRect(14, 12, 3, 5);
            ctx.fillRect(11, 17, 3, 7);
            break;

        case "8":
            // Üst halka (3px kalınlık)
            ctx.fillRect(9, 4, 10, 3);
            ctx.fillRect(7, 6, 3, 6);
            ctx.fillRect(18, 6, 3, 6);
            // Orta bel
            ctx.fillRect(9, 12, 10, 3);
            // Alt halka (biraz daha geniş tabanlı)
            ctx.fillRect(6, 14, 3, 7);
            ctx.fillRect(19, 14, 3, 7);
            ctx.fillRect(8, 21, 12, 3);
            break;

        case "9":
            // Üst kapalı halka (3px kalınlık)
            ctx.fillRect(8, 4, 11, 3);
            ctx.fillRect(7, 6, 3, 7);
            ctx.fillRect(18, 6, 3, 7);
            ctx.fillRect(8, 12, 11, 3);
            // Sağ kuyruk ve alt kavis
            ctx.fillRect(18, 13, 3, 8);
            ctx.fillRect(9, 21, 10, 3);
            break;
    }

    sendPrediction();
}

function sendPrediction() {
    const imgData = ctx.getImageData(0, 0, 28, 28).data;
    const grayscale = [];

    for (let i = 0; i < imgData.length; i += 4) {
        grayscale.push(imgData[i]);
    }

    fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: grayscale })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) return;

        document.getElementById("predictedDigit").innerText = data.prediction;

        data.probabilities.forEach((prob, digit) => {
            const bar = document.getElementById(`bar-${digit}`);
            const label = document.getElementById(`label-${digit}`);

            bar.style.width = `${prob}%`;
            label.innerText = `${prob.toFixed(1)}%`;

            if (digit === data.prediction) {
                bar.className = "bg-emerald-500 h-full rounded-full transition-all duration-150";
                label.className = "w-12 text-right font-mono font-bold text-emerald-400";
            } else {
                bar.className = "bg-blue-600/70 h-full rounded-full transition-all duration-150";
                label.className = "w-12 text-right font-mono text-slate-400";
            }
        });
    })
    .catch(() => {});
}

function resetBars() {
    document.getElementById("predictedDigit").innerText = "-";
    for (let i = 0; i < 10; i++) {
        const bar = document.getElementById(`bar-${i}`);
        const label = document.getElementById(`label-${i}`);
        if (bar && label) {
            bar.style.width = "0%";
            label.innerText = "0.0%";
            bar.className = "bg-blue-600 h-full rounded-full transition-all duration-150";
            label.className = "w-12 text-right font-mono text-slate-400";
        }
    }
}

function train() {
    const fileInput = document.getElementById("file");
    const statusText = document.getElementById("status");
    const trainBtn = document.getElementById("trainBtn");
    const badge = document.getElementById("badge");

    if (!fileInput.files[0]) {
        alert("Lütfen önce bir CSV veri seti seçin!");
        return;
    }

    let form = new FormData();
    form.append("file", fileInput.files[0]);
    form.append("lr", document.getElementById("lr").value);
    form.append("epoch", document.getElementById("epoch").value);
    form.append("model", document.getElementById("model").value);

    trainBtn.disabled = true;
    trainBtn.innerText = "Model Eğitiliyor...";
    trainBtn.classList.add("opacity-50", "cursor-not-allowed");
    statusText.innerText = "Veri seti işleniyor ve matrisler hesaplanıyor...";
    badge.innerText = "Eğitiliyor";
    badge.className = "px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30";

    fetch("/train", {
        method: "POST",
        body: form
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Eğitim hatası");
        return data;
    })
    .then(data => {
        statusText.innerText = "Eğitim Başarıyla Tamamlandı ✔";
        badge.innerText = "Tamamlandı";
        badge.className = "px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";

        document.getElementById("metricSamples").innerText = data.samples;
        document.getElementById("metricAcc").innerText = `%${data.final_acc}`;
        document.getElementById("metricLoss").innerText = data.final_loss;

        renderChart(data.acc, data.loss);
    })
    .catch(err => {
        console.error(err);
        statusText.innerText = "Hata: " + err.message;
        badge.innerText = "Hata";
        badge.className = "px-3 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30";
    })
    .finally(() => {
        trainBtn.disabled = false;
        trainBtn.innerText = "Eğitimi Başlat";
        trainBtn.classList.remove("opacity-50", "cursor-not-allowed");
    });
}

function renderChart(accData, lossData) {
    const ctx = document.getElementById("trainingChart").getContext("2d");
    const labels = accData.map((_, i) => `Epoch ${i + 1}`);

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Doğruluk (Acc %)",
                    data: accData,
                    borderColor: "#34d399",
                    backgroundColor: "rgba(52, 211, 153, 0.1)",
                    yAxisID: "y-acc",
                    tension: 0.3,
                    borderWidth: 2
                },
                {
                    label: "Kayıp (Loss)",
                    data: lossData,
                    borderColor: "#f59e0b",
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    yAxisID: "y-loss",
                    tension: 0.3,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                "y-acc": {
                    type: "linear",
                    position: "left",
                    min: 0,
                    max: 100,
                    ticks: { color: "#94a3b8" },
                    grid: { color: "#334155" }
                },
                "y-loss": {
                    type: "linear",
                    position: "right",
                    ticks: { color: "#94a3b8" },
                    grid: { drawOnChartArea: false }
                },
                x: {
                    ticks: { color: "#94a3b8" },
                    grid: { color: "#334155" }
                }
            },
            plugins: {
                legend: { labels: { color: "#cbd5e1" } }
            }
        }
    });
}