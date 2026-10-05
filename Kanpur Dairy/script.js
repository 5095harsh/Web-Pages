// --- 1. Dark Mode State Management ---
function initTheme() {
    const savedTheme = localStorage.getItem('kanpur_dairy_theme');
    const toggleBtn = document.querySelector('.theme-toggle-btn');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (toggleBtn) toggleBtn.innerText = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        if (toggleBtn) toggleBtn.innerText = '🌙';
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('kanpur_dairy_theme', isDark ? 'dark' : 'light');
    
    const toggleBtn = document.querySelector('.theme-toggle-btn');
    if (toggleBtn) toggleBtn.innerText = isDark ? '☀️' : '🌙';

    // Update 3D particle colors dynamically
    if (window.particleMaterial) {
        window.particleMaterial.color.setHex(isDark ? 0x00bcd4 : 0xffffff);
    }

    // Re-render Chart if initialized
    if (window.expenseChart) {
        updateChartColors();
    }
}

// --- 2. Subscription Calculator & Chart Integration ---
let selectedUnitPrice = 80;
let selectedProductName = 'A2 Cow Milk';
let expenseChart = null;

function selectProduct(element, price, name) {
    document.querySelectorAll('.product-chip').forEach(chip => chip.classList.remove('active'));
    element.classList.add('active');
    selectedUnitPrice = price;
    selectedProductName = name;
    updateCalculator();
}

function initCalculatorLogic() {
    const qtySlider = document.getElementById('qty-slider');
    const daysSlider = document.getElementById('days-slider');

    if (!qtySlider || !daysSlider) return;

    qtySlider.addEventListener('input', (e) => {
        document.getElementById('qty-val').innerText = e.target.value;
        updateCalculator();
    });

    daysSlider.addEventListener('input', (e) => {
        document.getElementById('days-val').innerText = e.target.value;
        updateCalculator();
    });

    initExpenseChart();
    updateCalculator();
}

function updateCalculator() {
    const qty = parseFloat(document.getElementById('qty-slider')?.value || 2);
    const days = parseInt(document.getElementById('days-slider')?.value || 30);

    const rawTotal = selectedUnitPrice * qty * days;
    const savings = Math.round(rawTotal * 0.05); // 5% direct savings
    const finalTotal = rawTotal - savings;

    document.getElementById('calc-total').innerText = finalTotal.toLocaleString('en-IN');
    document.getElementById('calc-savings').innerText = savings.toLocaleString('en-IN');

    updateChartData(finalTotal, savings);
}

function initExpenseChart() {
    const ctx = document.getElementById('expenseChart')?.getContext('2d');
    if (!ctx) return;

    const isDark = document.body.classList.contains('dark-mode');

    window.expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Final Amount', 'Subscription Savings'],
            datasets: [{
                data: [4560, 240],
                backgroundColor: ['#00838f', '#ffb300'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: isDark ? '#e2e8f0' : '#444444',
                        font: { family: 'Poppins' }
                    }
                }
            }
        }
    });
}

function updateChartData(finalAmount, savings) {
    if (!window.expenseChart) return;
    window.expenseChart.data.datasets[0].data = [finalAmount, savings];
    updateChartColors();
    window.expenseChart.update();
}

function updateChartColors() {
    if (!window.expenseChart) return;
    const isDark = document.body.classList.contains('dark-mode');
    window.expenseChart.options.plugins.legend.labels.color = isDark ? '#e2e8f0' : '#444444';
    window.expenseChart.data.datasets[0].backgroundColor = isDark 
        ? ['#00bcd4', '#ffd54f'] 
        : ['#00838f', '#ffb300'];
    window.expenseChart.update();
}

function bookSubscription() {
    const qty = document.getElementById('qty-slider').value;
    const days = document.getElementById('days-slider').value;
    const total = document.getElementById('calc-total').innerText;

    const msg = `Hi Kanpur Dairy! 👋 I want to book a subscription:%0A` +
                `• Product: ${selectedProductName}%0A` +
                `• Daily Qty: ${qty}%0A` +
                `• Duration: ${days} Days%0A` +
                `• Total Estimate: ₹${total}`;

    window.open(`https://wa.me/919876543210?text=${msg}`, '_blank');
}

// --- 3. Interactive 3D Milk Particle Background ---
function init3DBackground() {
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) return;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    canvasContainer.appendChild(renderer.domElement);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 350;
    const posArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 16; 
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const isDark = document.body.classList.contains('dark-mode');
    window.particleMaterial = new THREE.PointsMaterial({
        size: 0.045,
        color: isDark ? 0x00bcd4 : 0xffffff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
    });
    
    const particleMesh = new THREE.Points(particlesGeometry, window.particleMaterial);
    scene.add(particleMesh);

    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX / window.innerWidth - 0.5;
        mouseY = e.clientY / window.innerHeight - 0.5;
    });

    const animate = () => {
        requestAnimationFrame(animate);
        particleMesh.rotation.y += 0.0008;
        particleMesh.position.x += (mouseX * 0.4 - particleMesh.position.x) * 0.05;
        particleMesh.position.y += (-mouseY * 0.4 - particleMesh.position.y) * 0.05;

        const positions = particleMesh.geometry.attributes.position.array;
        for (let i = 1; i < particlesCount * 3; i += 3) {
            positions[i] += 0.0035; 
            if (positions[i] > 8) {
                positions[i] = -8; 
            }
        }
        particleMesh.geometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    };
    
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    init3DBackground();
    initCalculatorLogic();
});