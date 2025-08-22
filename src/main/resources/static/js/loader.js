// Initial page load
window.addEventListener('load', () => {
    const MIN_LOAD_TIME = 1600;
    const loader = document.getElementById('loader');
    const mainContent = document.getElementById('main-content');

    setTimeout(() => {
        hideLoader();
    }, MIN_LOAD_TIME);
});

// Function to show loader
function showLoader() {
    const loader = document.getElementById('loader');
    const mainContent = document.getElementById('main-content');
    const pagination = document.getElementById('vault-pagination');

    if (loader && mainContent) {
        loader.style.display = 'flex';
        mainContent.style.display = 'none';
        loader.classList.remove('fade-out');
    }

    // Hide pagination when showing loader
    if (pagination) {
        pagination.style.display = 'none';
    }
}

// Function to hide loader
function hideLoader() {
    const loader = document.getElementById('loader');
    const mainContent = document.getElementById('main-content');
    const pagination = document.getElementById('vault-pagination');

    if (loader && mainContent) {
        loader.classList.add('fade-out');
        setTimeout(() => {
            loader.style.display = 'none';
            mainContent.style.display = 'flex';
            setTimeout(() => {
                mainContent.classList.add('show');
                // Show pagination after main content is shown
                if (pagination && typeof VaultManager !== 'undefined') {
                    // Update pagination display based on current state
                    VaultManager.updatePaginationDisplay();
                }
            }, 10);
        }, 300);
    }
}

// Make functions globally available
window.showLoader = showLoader;
window.hideLoader = hideLoader;