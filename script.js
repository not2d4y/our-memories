document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.getElementById('upload-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const modal = document.getElementById('upload-modal');
    const closeBtn = document.querySelector('.close-btn');
    const submitUpload = document.getElementById('submit-upload');
    const fileInput = document.getElementById('file-input');
    const galleryContainer = document.getElementById('gallery-container');
    const uploadStatus = document.getElementById('upload-status');

    let photos = []; // Array untuk menyimpan URL foto yang ditampilkan di layar

    /* ====================================================================
       BAGIAN 1: PENGATURAN TEMA
       ==================================================================== */
    // Array nama class tema yang merujuk ke CSS.
    // Jika Anda menambahkan tema baru di style.css (misal: .theme-5),
    // tambahkan nama 'theme-5' ke dalam array ini.
    const themes = ['theme-1', 'theme-2', 'theme-3', 'theme-4'];
    
    function applyRandomTheme() {
        // Hapus semua class tema yang ada di body
        themes.forEach(theme => document.body.classList.remove(theme));
        
        // Pilih tema secara acak
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];
        document.body.classList.add(randomTheme);
        console.log("Tema berhasil di-refresh, sekarang aktif:", randomTheme);
    }

    /* ====================================================================
       BAGIAN 2: AUTO RENAME FOTO
       ==================================================================== */
    function generateAutoName(originalName) {
        // Menggunakan waktu saat ini (timestamp) sebagai nama unik
        const date = new Date();
        const timestamp = date.getTime();
        const extension = originalName.split('.').pop();
        return `Kenangan_${timestamp}.${extension}`;
    }

    /* ====================================================================
       BAGIAN 3: KONEKSI BACKEND API GITHUB (VERCEL)
       ==================================================================== */
    async function uploadToVercelGitHub(file, autoRenamedFilename) {
        uploadStatus.textContent = `Menghubungkan ke API... Mengunggah ${autoRenamedFilename}`;
        
        /* 
         * -----------------------------------------------------------
         * KODE BACKEND API GITHUB & VERCEL (Silakan disesuaikan)
         * -----------------------------------------------------------
         * Ganti URL 'https://api-vercel-anda.vercel.app/api/upload' 
         * dengan endpoint API Vercel milik Anda yang terhubung ke GitHub.
         * 
         * const formData = new FormData();
         * formData.append('image', file, autoRenamedFilename); // Menggunakan nama file baru (auto-rename)
         * 
         * try {
         *     const response = await fetch('https://api-vercel-anda.vercel.app/api/upload', {
         *         method: 'POST',
         *         body: formData,
         *         // Jika butuh headers seperti Authorization, tambahkan di sini:
         *         // headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
         *     });
         *     const result = await response.json();
         *     return result.imageUrl; // Sesuaikan dengan struktur response JSON dari Vercel API Anda
         * } catch (error) {
         *     console.error('Terjadi kesalahan saat upload ke GitHub via Vercel:', error);
         *     throw error;
         * }
         */

        // SIMULASI LOKAL (Hapus bagian di bawah ini jika API di atas sudah aktif):
        return new Promise(resolve => {
            setTimeout(() => {
                // Membuat object URL sementara agar foto bisa langsung tampil di HTML
                const fakeUrl = URL.createObjectURL(file);
                resolve(fakeUrl);
            }, 1000); // Simulasi delay internet 1 detik
        });
    }

    /* ====================================================================
       BAGIAN 4: RENDER GALERI
       ==================================================================== */
    function renderGallery() {
        if (photos.length === 0) {
            galleryContainer.innerHTML = '<div class="empty-state">Belum ada foto kenangan. Silakan upload!</div>';
            return;
        }
        
        galleryContainer.innerHTML = ''; // Bersihkan kontainer
        
        photos.forEach(url => {
            const card = document.createElement('div');
            card.className = 'photo-card';
            
            // Memberikan variabel CSS kustom (--rot) dengan rotasi acak antara -20 sampai 20 derajat
            // Variabel ini digunakan di file CSS untuk membuat efek tumpukan berantakan
            const randomRot = Math.floor(Math.random() * 40) - 20;
            card.style.setProperty('--rot', randomRot);
            
            const img = document.createElement('img');
            img.src = url;
            
            card.appendChild(img);
            galleryContainer.appendChild(card);
        });
    }

    /* ====================================================================
       BAGIAN 5: EVENT LISTENERS
       ==================================================================== */
    
    // Ketika tombol Refresh Tema (di navigasi kanan atas) diklik
    refreshBtn.addEventListener('click', (e) => {
        e.preventDefault();
        applyRandomTheme();
        // Render ulang galeri agar rotasi fotonya juga berubah/teracak ulang
        renderGallery(); 
    });

    // Menampilkan Modal Upload
    uploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.remove('hidden');
    });
    
    // Menutup Modal Upload
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        uploadStatus.textContent = '';
        fileInput.value = '';
    });

    // Proses Submit Upload
    submitUpload.addEventListener('click', async () => {
        const files = fileInput.files;
        if (files.length === 0) {
            alert("Pilih foto terlebih dahulu!");
            return;
        }

        submitUpload.disabled = true;

        // Loop jika mengunggah lebih dari 1 foto sekaligus
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // 1. Jalankan fitur Auto Rename
            const newFilename = generateAutoName(file.name);
            
            // 2. Jalankan fungsi Upload ke Backend/API
            try {
                const uploadedUrl = await uploadToVercelGitHub(file, newFilename);
                photos.push(uploadedUrl); // Simpan URL gambar ke dalam array
                uploadStatus.textContent = `Berhasil mengunggah ${newFilename}!`;
            } catch (error) {
                uploadStatus.textContent = `Gagal mengunggah ${newFilename}`;
            }
        }

        // Tutup modal dan refresh galeri setelah sukses upload
        setTimeout(() => {
            modal.classList.add('hidden');
            submitUpload.disabled = false;
            uploadStatus.textContent = '';
            fileInput.value = '';
            renderGallery(); 
        }, 800);
    });

    // Jalankan tema acak pertama kali saat website dibuka
    applyRandomTheme();
});
