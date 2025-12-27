// FILE: js/app.js - FIXED VERSION

/**
 * Initialize the application
 * This only runs on app.html (dashboard page)
 */
document.addEventListener('DOMContentLoaded', async () => {
    const currentPath = window.location.pathname;
    const isOnDashboard = currentPath.includes('app.html');
    
    // Only run dashboard initialization on app.html
    if (!isOnDashboard) {
        console.log('📄 Not on dashboard, skipping app.js initialization');
        return;
    }
    
    console.log('🚀 Dashboard initializing...');
    
    // 1. Setup MetaMask listeners
    if (typeof setupMetaMaskListeners === 'function') {
        setupMetaMaskListeners();
    }
    
    // 2. Initialize wallet buttons
    if (typeof initWalletButtons === 'function') {
        initWalletButtons();
    }
    
    // 3. Initialize UI event handlers (tabs, forms, etc.)
    if (typeof initEventHandlers === 'function') {
        initEventHandlers();
    }
    
    // 4. Initialize dashboard
    await initializeDashboard();
});

/**
 * Initialize dashboard (app.html only)
 */
async function initializeDashboard() {
    console.log('📊 Initializing Dashboard...');
    
    try {
        // Check if wallet was previously connected
        const wasConnected = localStorage.getItem('walletConnected') === 'true';
        
        // Try to connect
        const connected = await checkWalletConnection();
        
        if (!connected) {
            // If they had a session but it's gone, try to reconnect
            if (wasConnected) {
                console.log('🔄 Attempting reconnection...');
                const reconnected = await connectMetaMask();
                
                if (!reconnected) {
                    console.warn('❌ Reconnection failed. Redirecting...');
                    showNotification('Please connect your wallet', 'error');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                    return;
                }
            } else {
                // No previous connection - go back to home
                console.warn('❌ No wallet connected. Redirecting...');
                showNotification('Please connect your wallet', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
                return;
            }
        }
        
        // At this point, we're connected
        console.log('✅ Wallet connected:', userAddress);
        console.log('✅ Contract address:', CONFIG.SALVA_ADDRESS);
        
        // Load dashboard data
        await loadDashboardData();
        
    } catch (error) {
        console.error('❌ Dashboard initialization error:', error);
        showNotification('Failed to load dashboard', 'error');
    }
}

/**
 * Load all dashboard data
 */
async function loadDashboardData() {
    console.log('📥 Loading dashboard data...');
    
    try {
        // Load whitelisted tokens first
        if (typeof loadWhitelistedTokens === 'function') {
            console.log('Loading tokens...');
            await loadWhitelistedTokens();
        }
        
        // Load user's plans
        if (typeof loadUserPlansFromEvents === 'function') {
            console.log('Loading plans...');
            await loadUserPlansFromEvents();
        }
        
        // Update total balance after a short delay to ensure cards are rendered
        setTimeout(async () => {
            if (typeof updateTotalBalance === 'function') {
                console.log('Updating balance...');
                await updateTotalBalance();
            }
        }, 1000);
        
        console.log('✅ Dashboard data loaded successfully');
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Some data failed to load', 'warning');
    }
}

/**
 * Refresh dashboard data (can be called manually)
 */
async function refreshDashboard() {
    console.log('🔄 Refreshing dashboard...');
    showLoading('Refreshing data...');
    
    try {
        await loadDashboardData();
        showNotification('Dashboard refreshed', 'success');
    } catch (error) {
        console.error('Refresh error:', error);
        showNotification('Refresh failed', 'error');
    } finally {
        hideLoading();
    }
}

// Export to window
window.initializeDashboard = initializeDashboard;
window.loadDashboardData = loadDashboardData;
window.refreshDashboard = refreshDashboard;