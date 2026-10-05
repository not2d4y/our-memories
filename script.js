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
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file); // Ubah file jadi base64
            
            reader.onload = async () => {
                // Ambil base64-nya saja, hapus bagian "data:image/jpeg;base64,"
                const base64Data = reader.result.split(',')[1]; 

                try {
                    // GANTI URL DI BAWAH INI JIKA PERLU (atau biarkan /api/upload agar otomatis menyesuaikan domain)
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            filename: autoRenamedFilename,
                            imageBase64: base64Data
                        })
                    });

                    const result = await response.json();
                    
                    if (result.success) {
                        resolve(result.imageUrl); // Mengembalikan link foto dari GitHub
                    } else {
                        reject(result.error);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    reject(error);
                }
            };
            
            reader.onerror = error => reject(error);
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
