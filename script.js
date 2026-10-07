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
    const protectedContent = document.getElementById('protected-content');
    
    // Modal & Elemen Lain
    const uploadBtn = document.getElementById('upload-btn');
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
    const guessCanvas = document.getElementById('guess-canvas');
    const clueTitleText = document.getElementById('clue-title-text');
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

    // Floating Bubble Switcher
    const floatingThemeBtn = document.getElementById('floating-theme-btn');

    let photos = []; 
    let currentPlayer = "";
    let targetUrl = "";
    let currentGameMode = 'find-photo'; 
    let selectedLevelValue = 'normal'; 
    let timerInterval;
    let startTime;
    let gameActive = false;

    // --- VERIFIKASI PASSCODE UTAMA YANG AMAN DARI INSPECT ELEMENT ---
    const mainLoginOverlay = document.getElementById('main-login-overlay');
    const passcodeInput = document.getElementById('passcode-input');
    const submitPasscodeBtn = document.getElementById('submit-passcode-btn');
    const loginErrorMsg = document.getElementById('login-error-msg');

    // Cek apakah sudah login sah sebelumnya di sesi ini
    if (sessionStorage.getItem('auth_token') === 'AUTH_SUCCESS_TOKEN_99') {
        if (mainLoginOverlay) mainLoginOverlay.remove();
        if (protectedContent) protectedContent.classList.remove('hidden');
        fetchExistingPhotosFromGitHub();
    }

    async function handleLogin() {
        const passcode = passcodeInput.value.trim();
        if (passcode.length !== 6) {
            loginErrorMsg.textContent = "Passcode harus 6 angka!";
            loginErrorMsg.classList.remove('hidden');
            return;
        }

        submitPasscodeBtn.textContent = "Memeriksa...";
        submitPasscodeBtn.disabled = true;

        try {
            const response = await fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                sessionStorage.setItem('auth_token', data.token);
                
                if (mainLoginOverlay) mainLoginOverlay.remove();
                if (protectedContent) protectedContent.classList.remove('hidden');
                
                fetchExistingPhotosFromGitHub();
            } else {
                loginErrorMsg.textContent = "Passcode salah, coba lagi ya! 🥺";
                loginErrorMsg.classList.remove('hidden');
                passcodeInput.value = '';
            }
        } catch (error) {
            loginErrorMsg.textContent = "Terjadi kesalahan koneksi server.";
            loginErrorMsg.classList.remove('hidden');
        } finally {
            submitPasscodeBtn.textContent = "Masuk";
            submitPasscodeBtn.disabled = false;
        }
    }

    if (submitPasscodeBtn) {
        submitPasscodeBtn.addEventListener('click', handleLogin);
    }
    if (passcodeInput) {
        passcodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }

    // --- PENGATURAN TEMA (8 PILIHAN) ---
    const themes = ['theme-1', 'theme-2', 'theme-3', 'theme-4', 'theme-5', 'theme-6', 'theme-7', 'theme-8'];
    
    function applyRandomTheme() {
        themes.forEach(theme => document.body.classList.remove(theme));
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];
        document.body.classList.add(randomTheme);
        
        if (!gallerySection.classList.contains('hidden')) {
            renderGallery();
        }
    }

    applyRandomTheme();

    if (floatingThemeBtn) {
        floatingThemeBtn.addEventListener('click', () => {
            applyRandomTheme();
        });
    }

    // --- NAVIGASI ---
    if (hamburgerBtn) hamburgerBtn.addEventListener('click', () => sidebar.classList.add('active'));
    if (closeSidebar) closeSidebar.addEventListener('click', () => sidebar.classList.remove('active'));

    if (menuGallery) {
        menuGallery.addEventListener('click', (e) => {
            e.preventDefault();
            applyRandomTheme(); 
            gallerySection.classList.remove('hidden');
            gameSection.classList.add('hidden');
            sidebar.classList.remove('active');
            stopTimer();
        });
    }

    if (menuGame) {
        menuGame.addEventListener('click', (e) => {
            e.preventDefault();
            themes.forEach(theme => document.body.classList.remove(theme));
            document.body.classList.add('theme-3');
            gallerySection.classList.add('hidden');
            gameSection.classList.remove('hidden');
            sidebar.classList.remove('active');
            fetchLeaderboard();
        });
    }

    // --- UPDATE OPSI LEVEL BERDASARKAN MODE GAME ---
    function updateLevelOptions(mode) {
        if (!levelMenu) return;
        levelMenu.innerHTML = '';
        if (mode === 'find-photo') {
            levelMenu.innerHTML = `
                <div class="dropdown-item" data-value="easy">🟢 Easy (5-10 Foto)</div>
                <div class="dropdown-item" data-value="normal">🟡 Normal (10-15 Foto)</div>
                <div class="dropdown-item" data-value="hard">🟠 Hard (15-20 Foto)</div>
                <div class="dropdown-item" data-value="iloveyou">❤️ I Love You (Full Foto!)</div>
            `;
            selectedLevelValue = 'normal';
            if (levelSelected) levelSelected.textContent = '🟡 Normal (10-15 Foto) ▾';
        } else if (mode === 'guess-photo') {
            levelMenu.innerHTML = `
                <div class="dropdown-item" data-value="guess-easy">🟢 Easy (70% Terlihat)</div>
                <div class="dropdown-item" data-value="guess-normal">🟡 Normal (50% Terlihat)</div>
                <div class="dropdown-item" data-value="guess-hard">🟠 Hard (35% Terlihat)</div>
            `;
            selectedLevelValue = 'guess-normal';
            if (levelSelected) levelSelected.textContent = '🟡 Normal (50% Terlihat) ▾';
        }
        bindLevelItems();
    }

    function bindLevelItems() {
        document.querySelectorAll('#level-menu .dropdown-item:not(.disabled)').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedLevelValue = item.getAttribute('data-value');
                levelSelected.textContent = item.textContent + ' ▾';
                levelMenu.classList.remove('show'); 
                fetchLeaderboard(); 
            });
        });
    }

    updateLevelOptions('find-photo');

    // --- CUSTOM DROPDOWN LOGIC (STAY INDEPENDENT) ---
    if (gameModeSelected && gameModeMenu) {
        gameModeSelected.addEventListener('click', (e) => {
            e.stopPropagation();
            gameModeMenu.classList.toggle('show');
        });

        document.querySelectorAll('#game-mode-menu .dropdown-item:not(.disabled)').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                currentGameMode = item.getAttribute('data-value');
                gameModeSelected.textContent = item.textContent + ' ▾';
                
                gameModeMenu.classList.remove('show'); 
                
                updateLevelOptions(currentGameMode);
                stopTimer();
                scatterArea.innerHTML = '';
                targetPhoto.src = '';
                guessCanvas.classList.add('hidden');
                fetchLeaderboard(); 
            });
        });
    }

    if (levelSelected && levelMenu) {
        levelSelected.addEventListener('click', (e) => {
            e.stopPropagation();
            levelMenu.classList.toggle('show');
        });
    }

    window.addEventListener('click', () => {
        if (levelMenu) levelMenu.classList.remove('show');
        if (gameModeMenu) gameModeMenu.classList.remove('show');
    });

    // --- FITUR NOTES / CATATAN SPESIAL ---
    const floatingNoteBubble = document.getElementById('floating-note-bubble');
    const noteModal = document.getElementById('note-modal');
    const closeNote = document.querySelector('.close-note');
    const noteDisplayText = document.getElementById('note-display-text');
    const noteViewArea = document.getElementById('note-view-area');
    const noteEditArea = document.getElementById('note-edit-area');
    const noteTextarea = document.getElementById('note-textarea');
    const saveNoteBtn = document.getElementById('save-note-btn');
    const editNoteBtn = document.getElementById('edit-note-btn');
    const deleteNoteBtn = document.getElementById('delete-note-btn');

    let currentNoteContent = "";

    async function fetchNoteData() {
        try {
            const res = await fetch(`/api/note?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                
                // Jangan timpa jika data dari server kosong tapi local variable sudah terisi
                if (data.content && data.content.trim() !== "") {
                    currentNoteContent = data.content;
                } else if (!data.content) {
                    currentNoteContent = "";
                }
                
                if (currentNoteContent.trim() !== "" && !data.isRead) {
                    floatingNoteBubble.classList.add('unread');
                } else {
                    floatingNoteBubble.classList.remove('unread');
                }
            }
        } catch (error) {
            console.error("Gagal memuat catatan", error);
        }
    }

    // Buka Modal Notes
    if (floatingNoteBubble) {
        floatingNoteBubble.addEventListener('click', async () => {
            noteModal.classList.remove('hidden');
            await fetchNoteData();

            if (currentNoteContent.trim() === "") {
                noteViewArea.classList.add('hidden');
                noteEditArea.classList.remove('hidden');
                noteTextarea.value = "";
            } else {
                noteViewArea.classList.remove('hidden');
                noteEditArea.classList.add('hidden');
                noteDisplayText.textContent = currentNoteContent;

                if (floatingNoteBubble.classList.contains('unread')) {
                    floatingNoteBubble.classList.remove('unread');
                    saveNoteToBackend(currentNoteContent, true);
                }
            }
        });
    }

    if (closeNote) {
        closeNote.addEventListener('click', () => noteModal.classList.add('hidden'));
    }

    if (editNoteBtn) {
        editNoteBtn.addEventListener('click', () => {
            noteViewArea.classList.add('hidden');
            noteEditArea.classList.remove('hidden');
            noteTextarea.value = currentNoteContent;
        });
    }

    // Simpan Catatan Baru
    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', async () => {
            const newContent = noteTextarea.value.trim();
            if (!newContent) return alert("Catatan tidak boleh kosong!");

            saveNoteBtn.textContent = "Menyimpan...";
            saveNoteBtn.disabled = true;

            await saveNoteToBackend(newContent, false); 

            saveNoteBtn.textContent = "💾 Simpan Catatan";
            saveNoteBtn.disabled = false;
            
            currentNoteContent = newContent;
            noteDisplayText.textContent = newContent;
            noteEditArea.classList.add('hidden');
            noteViewArea.classList.remove('hidden');
            floatingNoteBubble.classList.add('unread');
        });
    }

    // Hapus Catatan
    if (deleteNoteBtn) {
        deleteNoteBtn.addEventListener('click', async () => {
            if (confirm("Yakin ingin menghapus catatan ini?")) {
                await saveNoteToBackend("", true);
                currentNoteContent = "";
                noteDisplayText.textContent = "Belum ada catatan.";
                floatingNoteBubble.classList.remove('unread');
                noteModal.classList.add('hidden');
            }
        });
    }

    async function saveNoteToBackend(content, isRead) {
        try {
            await fetch('/api/note', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, isRead })
            });
        } catch (error) {
            console.error("Gagal menyimpan catatan ke server", error);
        }
    }

    // Panggil saat pertama kali load
    fetchNoteData();


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
        if (!galleryContainer) return;
        galleryContainer.innerHTML = photos.length === 0 ? '<div class="empty-state">Belum ada foto.</div>' : ''; 
        photos.forEach(url => {
            const card = document.createElement('div');
            card.className = 'photo-card';
            const randomRotation = Math.floor(Math.random() * 31) - 15;
            card.style.setProperty('--rot', randomRotation);
            
            const img = document.createElement('img');
            img.src = url;
            card.addEventListener('click', () => { lightboxModal.classList.remove('hidden'); lightboxImg.src = url; });
            card.appendChild(img);
            galleryContainer.appendChild(card);
        });
    }

    // --- LOGIKA UTAMA START GAME ---
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const name = playerNameInput.value.trim();
            if (!name) return alert("Isi nama dulu!");
            currentPlayer = name;
            currentPlayerDisplay.textContent = currentPlayer;
            loginPanel.classList.add('hidden');
            gameArena.classList.remove('hidden');
        });
    }

    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            if (photos.length < 5) return alert("Upload minimal 5 foto dulu di galeri!");

            if (currentGameMode === 'find-photo') {
                startFindPhotoGame();
            } else if (currentGameMode === 'guess-photo') {
                startGuessPhotoGame();
            }
        });
    }

    // --- MODE 1: CARI FOTO DI LAYAR ---
    function startFindPhotoGame() {
        clueTitleText.textContent = "Cari foto ini!";
        targetPhoto.classList.remove('hidden');
        guessCanvas.classList.add('hidden');

        targetUrl = photos[Math.floor(Math.random() * photos.length)];
        targetPhoto.src = targetUrl;
        
        scatterArea.innerHTML = '';
        
        const level = selectedLevelValue;
        let count = 10;
        if (level === 'easy') count = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
        else if (level === 'normal') count = Math.floor(Math.random() * (15 - 10 + 1)) + 10;
        else if (level === 'hard') count = Math.floor(Math.random() * (20 - 15 + 1)) + 15;
        else if (level === 'iloveyou') count = photos.length;

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

            while (overlapping && attempts < 50) {
                finalX = Math.floor(Math.random() * maxX);
                finalY = Math.floor(Math.random() * maxY);
                overlapping = false;

                for (let pos of placedPositions) {
                    const dx = finalX - pos.x;
                    const dy = finalY - pos.y;
                    if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
                        overlapping = true;
                        break;
                    }
                }
                attempts++;
            }

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

        initTimer();
    }

    // --- MODE 2: TEBAK FOTO (POTONGAN MISTERIUS) ---
    function startGuessPhotoGame() {
        clueTitleText.textContent = "Tebak potongan ini!";
        targetPhoto.classList.add('hidden');
        guessCanvas.classList.remove('hidden');

        targetUrl = photos[Math.floor(Math.random() * photos.length)];
        
        const imgObj = new Image();
        imgObj.crossOrigin = "anonymous";
        imgObj.src = targetUrl;
        imgObj.onload = () => {
            const ctx = guessCanvas.getContext('2d');
            guessCanvas.width = 75;
            guessCanvas.height = 75;

            let percentage = 0.5; // Normal
            if (selectedLevelValue === 'guess-easy') percentage = 0.7;
            else if (selectedLevelValue === 'guess-hard') percentage = 0.35;

            const cropWidth = imgObj.width * percentage;
            const cropHeight = imgObj.height * percentage;

            const maxSX = Math.max(0, imgObj.width - cropWidth);
            const maxSY = Math.max(0, imgObj.height - cropHeight);
            const sx = Math.floor(Math.random() * (maxSX + 1));
            const sy = Math.floor(Math.random() * (maxSY + 1));

            ctx.clearRect(0, 0, 75, 75);
            ctx.drawImage(imgObj, sx, sy, cropWidth, cropHeight, 0, 0, 75, 75);
        };

        scatterArea.innerHTML = '';
        
        let options = [...photos].sort(() => 0.5 - Math.random()).slice(0, 6);
        if (!options.includes(targetUrl)) options[0] = targetUrl;
        options.sort(() => 0.5 - Math.random());

        options.forEach(url => {
            const optImg = document.createElement('img');
            optImg.src = url;
            optImg.className = 'guess-option-card';
            optImg.addEventListener('click', () => {
                if (!gameActive) return;
                if (url === targetUrl) {
                    winGame();
                } else {
                    optImg.style.opacity = '0.3';
                    optImg.style.pointerEvents = 'none';
                }
            });
            scatterArea.appendChild(optImg);
        });

        initTimer();
    }

    function initTimer() {
        gameActive = true;
        startTime = Date.now();
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeDisplay.textContent = ((Date.now() - startTime) / 1000).toFixed(2);
        }, 50);
    }

    function winGame() {
        gameActive = false;
        clearInterval(timerInterval);
        const finalTime = parseFloat(timeDisplay.textContent);
        alert(`Yeay Benar! Waktu: ${finalTime} detik.`);
        saveScoreToGitHub(currentPlayer, finalTime);
    }

    function stopTimer() {
        gameActive = false;
        clearInterval(timerInterval);
        timeDisplay.textContent = "0.00";
    }

    // --- LEADERBOARD BERDASARKAN MODE & DIFFICULTY ---
    let currentLeaderboard = []; 

    async function fetchLeaderboard() {
        if (!leaderboardList) return;
        leaderboardList.innerHTML = '<li>Memuat...</li>';
        try {
            const antiCache = new Date().getTime();
            const response = await fetch(`https://api.github.com/repos/not2d4y/our-memories/contents/leaderboard/scores.json?t=${antiCache}`);
            if (response.ok) {
                const data = await response.json();
                const allScores = JSON.parse(atob(data.content)); 
                
                currentLeaderboard = allScores.filter(s => s.mode === currentGameMode && s.difficulty === selectedLevelValue);
                renderLeaderboardList(currentLeaderboard);
            } else {
                leaderboardList.innerHTML = '<li>Belum ada rekor.</li>';
            }
        } catch (error) { 
            leaderboardList.innerHTML = '<li>Gagal memuat rekor.</li>'; 
        }
    }

    function renderLeaderboardList(scores) {
        if (!leaderboardList) return;
        leaderboardList.innerHTML = '';
        if (scores.length === 0) {
            leaderboardList.innerHTML = '<li>Belum ada rekor.</li>';
            return;
        }
        scores.sort((a, b) => a.time - b.time).slice(0, 5).forEach((s, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👏';
            const li = document.createElement('li');
            li.innerHTML = `<span>${medal} ${s.name}</span> <span>${s.time}s</span>`;
            leaderboardList.appendChild(li);
        });
    }

    async function saveScoreToGitHub(name, time) {
        currentLeaderboard.push({ name, time, mode: currentGameMode, difficulty: selectedLevelValue });
        renderLeaderboardList(currentLeaderboard);

        try {
            await fetch('/api/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, time, mode: currentGameMode, difficulty: selectedLevelValue })
            });
        } catch (error) { 
            console.error("Gagal menyimpan skor", error); 
        }
    }

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

    if (uploadBtn) {
        uploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.remove('hidden');
            sidebar.classList.remove('active');
        });
    }
    
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    if (lightboxClose) lightboxClose.addEventListener('click', () => lightboxModal.classList.add('hidden'));
});
