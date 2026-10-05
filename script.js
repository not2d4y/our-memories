document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.getElementById('upload-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const modal = document.getElementById('upload-modal');
    const closeBtn = document.querySelector('.close-btn');
    const submitUpload = document.getElementById('submit-upload');
    const fileInput = document.getElementById('file-input');
    const galleryContainer = document.getElementById('gallery-container');
    const uploadStatus = document.getElementById('upload-status');
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');

    let photos = []; 

    /* ====================================================================
       BAGIAN 1: PENGATURAN TEMA
       ==================================================================== */
    const themes = ['theme-1', 'theme-2', 'theme-3', 'theme-4'];
    
    function applyRandomTheme() {
        themes.forEach(theme => document.body.classList.remove(theme));
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];
        document.body.classList.add(randomTheme);
        console.log("Tema aktif:", randomTheme);
    }

    /* ====================================================================
       BAGIAN 2: AUTO RENAME FOTO
       ==================================================================== */
    function generateAutoName(originalName) {
        const date = new Date();
        const timestamp = date.getTime();
        const extension = originalName.split('.').pop();
        return `Kenangan_${timestamp}.${extension}`;
    }

    /* ====================================================================
       BAGIAN 3: AMBIL FOTO OTOMATIS DARI GITHUB (Agar muncul di semua device)
       ==================================================================== */
    async function fetchExistingPhotosFromGitHub() {
        try {
            // Mengambil daftar file dari folder "foto-kenangan" di repo GitHub Anda
            const response = await fetch(`https://api.github.com/repos/not2d4y/our-memories/contents/foto-kenangan`);
            const files = await response.json();

            if (Array.isArray(files)) {
                // Saring hanya file gambar dan ambil link download_url-nya
                photos = files
                    .filter(file => file.type === 'file' && /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name))
                    .map(file => file.download_url);
                
                renderGallery(); 
            } else {
                console.log("Folder foto-kenangan masih kosong.");
                renderGallery();
            }
        } catch (error) {
            console.error("Gagal mengambil foto dari GitHub:", error);
            renderGallery();
        }
    }

    /* ====================================================================
       BAGIAN 4: KONEKSI BACKEND API GITHUB (VERCEL)
       ==================================================================== */
    async function uploadToVercelGitHub(file, autoRenamedFilename) {
        uploadStatus.textContent = `Menghubungkan ke API... Mengunggah ${autoRenamedFilename}`;
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file); 
            
            reader.onload = async () => {
                const base64Data = reader.result.split(',')[1]; 

                try {
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
                        resolve(result.imageUrl); 
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
       BAGIAN 5: RENDER GALERI
       ==================================================================== */
    function renderGallery() {
        if (photos.length === 0) {
            galleryContainer.innerHTML = '<div class="empty-state">Belum ada foto kenangan. Silakan upload!</div>';
            return;
        }
        
        galleryContainer.innerHTML = ''; 
        
        photos.forEach(url => {
            const card = document.createElement('div');
            card.className = 'photo-card';
            
            const randomRot = Math.floor(Math.random() * 40) - 20;
            card.style.setProperty('--rot', randomRot);
            
            const img = document.createElement('img');
            img.src = url;
            
            card.addEventListener('click', () => {
                if (lightboxModal && lightboxImg) {
                    lightboxModal.classList.remove('hidden');
                    lightboxImg.src = url;
                }
            });
            
            card.appendChild(img);
            galleryContainer.appendChild(card);
        });
    }

    /* ====================================================================
       BAGIAN 6: EVENT LISTENERS TOMBOL
       ==================================================================== */
    refreshBtn.addEventListener('click', (e) => {
        e.preventDefault();
        applyRandomTheme();
        renderGallery(); 
    });

    uploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.remove('hidden');
    });
    
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        uploadStatus.textContent = '';
        fileInput.value = '';
    });

    submitUpload.addEventListener('click', async () => {
        const files = fileInput.files;
        if (files.length === 0) {
            alert("Pilih foto terlebih dahulu!");
            return;
        }

        submitUpload.disabled = true;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const newFilename = generateAutoName(file.name);
            
            try {
                const uploadedUrl = await uploadToVercelGitHub(file, newFilename);
                photos.push(uploadedUrl); 
                uploadStatus.textContent = `Berhasil mengunggah ${newFilename}!`;
            } catch (error) {
                uploadStatus.textContent = `Gagal mengunggah ${newFilename}`;
            }
        }

        setTimeout(() => {
            modal.classList.add('hidden');
            submitUpload.disabled = false;
            uploadStatus.textContent = '';
            fileInput.value = '';
            renderGallery(); 
        }, 800);
    });

    /* ====================================================================
       BAGIAN 7: EVENT LISTENER LIGHTBOX (ZOOM FOTO)
       ==================================================================== */
    if (lightboxClose) {
        lightboxClose.addEventListener('click', () => {
            lightboxModal.classList.add('hidden');
        });
    }

    if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => {
            if (e.target !== lightboxImg) {
                lightboxModal.classList.add('hidden');
            }
        });
    }

    // Jalankan fungsi awal saat website dibuka
    applyRandomTheme();
    fetchExistingPhotosFromGitHub(); // Menarik foto otomatis dari GitHub
});
