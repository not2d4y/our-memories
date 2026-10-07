document.addEventListener('DOMContentLoaded', () => {
    // Navigasi & Sidebar
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('close-sidebar');
    const menuGallery = document.getElementById('menu-gallery');
    const menuGame = document.getElementById('menu-game');
    
    const gallerySection = document.getElementById('gallery-section');
    const gameSection = document.getElementById('game-section');
    const galleryContainer = document.getElementById('gallery-container');
    
    // Modal & Elemen Lain
    const uploadBtn = document.getElementById('upload-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const modal = document.getElementById('upload-modal');
    const closeBtn = document.querySelector('.close-btn');
    const submitUpload = document.getElementById('submit-upload');
    const fileInput = document.getElementById('file-input');
    const uploadStatus = document.getElementById('upload-status');
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');

    // Game Elements
    const loginPanel = document.getElementById('login-panel');
    const gameArena = document.getElementById('game-arena');
    const loginBtn = document.getElementById('login-btn');
    const playerNameInput = document.getElementById('player-name');
    const currentPlayerDisplay = document.getElementById('current-player');
    const startGameBtn = document.getElementById('start-game-btn');
    const targetPhoto = document.getElementById('target-photo');
    const scatterArea = document.getElementById('scatter-area');
    const timeDisplay = document.getElementById('time-display');
    const leaderboardList = document.getElementById('leaderboard-list');

    // Modal Leaderboard Elements
    const leaderboardModal = document.getElementById('leaderboard-modal');
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    const closeLeaderboard = document.querySelector('.close-leaderboard');

    // Custom Dropdown Elements
    const levelSelected = document.getElementById('level-selected');
    const levelMenu = document.getElementById('level-menu');
    const gameModeSelected = document.getElementById('game-mode-selected');
    const gameModeMenu = document.getElementById('game-mode-menu');

    let photos = []; 
    let currentPlayer = "";
    let targetUrl = "";
    let timerInterval;
    let startTime;
    let gameActive = false;
    let selectedLevelValue = 'normal'; // Default level

    // --- PENGATURAN TEMA ---
    const themes = ['theme-1', 'theme-2', 'theme-3', 'theme-4'];
    
    function applyRandomTheme() {
        themes.forEach(theme => document.body.classList.remove(theme));
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];
        document.body.classList.add(randomTheme);
        console.log("Tema acak aktif:", randomTheme);
    }

    applyRandomTheme();

    // --- NAVIGASI ---
    hamburgerBtn.addEventListener('click', () => sidebar.classList.add('active'));
    closeSidebar.addEventListener('click', () => sidebar.classList.remove('active'));

    menuGallery.addEventListener('click', (e) => {
        e.preventDefault();
        applyRandomTheme(); 
        gallerySection.classList.remove('hidden');
        gameSection.classList.add('hidden');
        sidebar.classList.remove('active');
        stopTimer();
    });

    menuGame.addEventListener('click', (e) => {
        e.preventDefault();
        themes.forEach(theme => document.body.classList.remove(theme));
        document.body.classList.add('theme-3'); // Default Pink Sakura
        gallerySection.classList.add('hidden');
        gameSection.classList.remove('hidden');
        sidebar.classList.remove('active');
        fetchLeaderboard();
    });

    // --- CUSTOM DROPDOWN LOGIC ---
    if (levelSelected && levelMenu) {
        levelSelected.addEventListener('click', (e) => {
            e.stopPropagation();
            levelMenu.classList.toggle('hidden');
            if (gameModeMenu) gameModeMenu.classList.add('hidden');
        });

        document.querySelectorAll('#level-menu .dropdown-item:not(.disabled)').forEach(item => {
            item.addEventListener('click', () => {
                selectedLevelValue = item.getAttribute('data-value');
                levelSelected.textContent = item.textContent + ' ▾';
                levelMenu.classList.add('hidden');
            });
        });
    }

    if (gameModeSelected && gameModeMenu) {
        gameModeSelected.addEventListener('click', (e) => {
            e.stopPropagation();
            gameModeMenu.classList.toggle('hidden');
            if (levelMenu) levelMenu.classList.add('hidden');
        });

        document.querySelectorAll('#game-mode-menu .dropdown-item:not(.disabled)').forEach(item => {
            item.addEventListener('click', () => {
                gameModeSelected.textContent = item.textContent + ' ▾';
                gameModeMenu.classList.add('hidden');
            });
        });
    }

    // Tutup dropdown jika klik di luar
    window.addEventListener('click', () => {
        if (levelMenu) levelMenu.classList.add('hidden');
        if (gameModeMenu) gameModeMenu.classList.add('hidden');
    });

    // --- AMBIL FOTO GITHUB ---
    async function fetchExistingPhotosFromGitHub() {
        try {
            const response = await fetch(`https://api.github.com/repos/not2d4y/our-memories/contents/foto-kenangan`);
            const files = await response.json();
            if (Array.isArray(files)) {
                photos = files.filter(f => f.type === 'file' && /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name)).map(f => f.download_url);
                renderGallery(); 
            }
        } catch (error) { console.error("Gagal mengambil foto dari GitHub:", error); }
    }

    function renderGallery() {
        galleryContainer.innerHTML = photos.length === 0 ? '<div class="empty-state">Belum ada foto.</div>' : ''; 
        photos.forEach(url => {
            const card = document.createElement('div');
            card.className = 'photo-card';
            card.style.setProperty('--rot', Math.floor(Math.random() * 40) - 20);
            const img = document.createElement('img');
            img.src = url;
            card.addEventListener('click', () => { lightboxModal.classList.remove('hidden'); lightboxImg.src = url; });
            card.appendChild(img);
            galleryContainer.appendChild(card);
        });
    }

    // --- LOGIKA GAME & LEVEL ---
    loginBtn.addEventListener('click', () => {
        const name = playerNameInput.value.trim();
        if (!name) return alert("Isi nama dulu!");
        currentPlayer = name;
        currentPlayerDisplay.textContent = currentPlayer;
        loginPanel.classList.add('hidden');
        gameArena.classList.remove('hidden');
    });

    startGameBtn.addEventListener('click', () => {
        if (photos.length < 5) return alert("Upload minimal 5 foto dulu di galeri!");
        
        targetUrl = photos[Math.floor(Math.random() * photos.length)];
        targetPhoto.src = targetUrl;
        
        scatterArea.innerHTML = '';
        
        // Tentukan jumlah foto berdasarkan level kustom yang dipilih
        const level = selectedLevelValue;
        let count = 10;
        
        if (level === 'easy') {
            count = Math.floor(Math.random() * (10 - 5 + 1)) + 5; // Random 5 - 10
        } else if (level === 'normal') {
            count = Math.floor(Math.random() * (15 - 10 + 1)) + 10; // Random 10 - 15
        } else if (level === 'hard') {
            count = Math.floor(Math.random() * (20 - 15 + 1)) + 15; // Random 15 - 20
        } else if (level === 'iloveyou') {
            count = photos.length; // Full foto dari storage
        }

        let gamePhotos = [...photos].sort(() => 0.5 - Math.random()).slice(0, count);
        if(!gamePhotos.includes(targetUrl)) gamePhotos[0] = targetUrl;

        const placedPositions = [];
        const minDistance = 65; 
        const photoSize = 85; 

        gamePhotos.sort(() => 0.5 - Math.random()).forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            img.className = 'scattered-photo';
            
            const maxX = scatterArea.clientWidth - photoSize;
            const maxY = scatterArea.clientHeight - photoSize;
            
            let finalX, finalY;
            let overlapping = true;
            let attempts = 0;
            const maxAttempts = 50;

            while (overlapping && attempts < maxAttempts) {
                finalX = Math.floor(Math.random() * maxX);
                finalY = Math.floor(Math.random() * maxY);
                overlapping = false;

                for (let pos of placedPositions) {
                    const dx = finalX - pos.x;
                    const dy = finalY - pos.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < minDistance) {
                        overlapping = true;
                        break;
                    }
                }
                attempts++;
            }

            // Batasi posisi agar tidak melebihi border dan tidak memotong lebih dari 20% foto
            finalX = Math.max(0, Math.min(finalX, scatterArea.clientWidth - (photoSize * 0.8)));
            finalY = Math.max(0, Math.min(finalY, scatterArea.clientHeight - (photoSize * 0.8)));

            placedPositions.push({ x: finalX, y: finalY });

            img.style.left = `${finalX}px`;
            img.style.top = `${finalY}px`;
            img.style.transform = `rotate(${Math.floor(Math.random() * 90) - 45}deg)`;
            img.style.zIndex = Math.floor(Math.random() * 100);

            img.addEventListener('click', () => {
                if(!gameActive) return;
                if (url === targetUrl) winGame();
                else img.style.zIndex = -1;
            });
            scatterArea.appendChild(img);
        });

        gameActive = true;
        startTime = Date.now();
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeDisplay.textContent = ((Date.now() - startTime) / 1000).toFixed(2);
        }, 50);
    });

    function winGame() {
        gameActive = false;
        clearInterval(timerInterval);
        const finalTime = parseFloat(timeDisplay.textContent);
        alert(`Yeay Ketemu! Waktu: ${finalTime} detik.`);
        saveScoreToGitHub(currentPlayer, finalTime);
    }

    function stopTimer() {
        gameActive = false;
        clearInterval(timerInterval);
        timeDisplay.textContent = "0.00";
    }

    // --- LEADERBOARD GITHUB API (DENGAN LIVE UPDATE) ---
    let currentLeaderboard = []; 

    async function fetchLeaderboard() {
        leaderboardList.innerHTML = '<li>Memuat...</li>';
        try {
            const antiCache = new Date().getTime();
            const response = await fetch(`https://api.github.com/repos/not2d4y/our-memories/contents/leaderboard/scores.json?t=${antiCache}`);
            if (response.ok) {
                const data = await response.json();
                currentLeaderboard = JSON.parse(atob(data.content)); 
                renderLeaderboardList(currentLeaderboard);
            } else {
                leaderboardList.innerHTML = '<li>Belum ada rekor.</li>';
            }
        } catch (error) { 
            leaderboardList.innerHTML = '<li>Gagal memuat rekor.</li>'; 
        }
    }

    function renderLeaderboardList(scores) {
        leaderboardList.innerHTML = '';
        scores.sort((a, b) => a.time - b.time).slice(0, 5).forEach((s, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👏';
            const li = document.createElement('li');
            li.innerHTML = `<span>${medal} ${s.name}</span> <span>${s.time}s</span>`;
            leaderboardList.appendChild(li);
        });
    }

    async function saveScoreToGitHub(name, time) {
        currentLeaderboard.push({ name, time });
        renderLeaderboardList(currentLeaderboard);

        try {
            await fetch('/api/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, time })
            });
        } catch (error) { 
            console.error("Gagal menyimpan skor", error); 
        }
    }

    // --- MODAL LEADERBOARD EVENT ---
    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', () => {
            leaderboardModal.classList.remove('hidden');
            fetchLeaderboard(); 
        });
    }

    if (closeLeaderboard) {
        closeLeaderboard.addEventListener('click', () => {
            leaderboardModal.classList.add('hidden');
        });
    }

    if (leaderboardModal) {
        leaderboardModal.addEventListener('click', (e) => {
            if (e.target === leaderboardModal) {
                leaderboardModal.classList.add('hidden');
            }
        });
    }

    // --- EVENT LAINNYA ---
    refreshBtn.addEventListener('click', (e) => {
        e.preventDefault();
        applyRandomTheme(); 
        if(!gallerySection.classList.contains('hidden')) renderGallery();
        sidebar.classList.remove('active');
    });

    uploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.remove('hidden');
        sidebar.classList.remove('active');
    });
    
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    
    if(lightboxClose) lightboxClose.addEventListener('click', () => lightboxModal.classList.add('hidden'));

    fetchExistingPhotosFromGitHub();
});
