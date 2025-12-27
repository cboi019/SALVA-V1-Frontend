// FILE: js/wallet.js - FIXED VERSION

let isConnecting = false;

/**
 * Show wallet selection modal
 */
function showWalletModal() {
    // Check if modal already exists
    let modal = document.getElementById('walletSelectionModal');
    
    if (!modal) {
        // Create modal
        modal = document.createElement('div');
        modal.id = 'walletSelectionModal';
        modal.className = 'wallet-modal';
        modal.innerHTML = `
            <div class="wallet-modal-content">
                <button class="wallet-close" onclick="closeWalletModal()">×</button>
                <h3>Connect Your Wallet</h3>
                <button class="wallet-option" onclick="connectMetaMask()">
                    <span>🦊</span>
                    <div>
                        <strong>MetaMask</strong>
                        <small>Connect using MetaMask wallet</small>
                    </div>
                </button>
                <button class="wallet-option" style="opacity: 0.5; cursor: not-allowed;" disabled>
                    <span>👛</span>
                    <div>
                        <strong>WalletConnect</strong>
                        <small>Coming soon...</small>
                    </div>
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Show modal with animation
    setTimeout(() => {
        modal.style.display = 'flex';
    }, 10);
}

/**
 * Close wallet selection modal
 */
function closeWalletModal() {
    const modal = document.getElementById('walletSelectionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Show notification to user
 */
function showNotification(msg, type = 'success') {
    console.log(`[${type.toUpperCase()}] ${msg}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = msg;
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/**
 * Show loading modal
 */
function showLoading(text = 'Processing...') {
    const modal = document.getElementById('loadingModal');
    const loadingText = document.getElementById('loadingText');
    if (modal) {
        modal.classList.add('show');
        if (loadingText) loadingText.textContent = text;
    }
}

/**
 * Hide loading modal
 */
function hideLoading() {
    const modal = document.getElementById('loadingModal');
    if (modal) modal.classList.remove('show');
}

/**
 * Get MetaMask provider (handles multiple wallets)
 */
async function getMetaMaskProvider() {
    if (!window.ethereum) return null;
    
    // If multiple wallets, find MetaMask
    if (window.ethereum.providers) {
        return window.ethereum.providers.find(p => p.isMetaMask) || null;
    }
    
    // Single wallet
    return window.ethereum.isMetaMask ? window.ethereum : null;
}

/**
 * Update wallet UI across the site
 */
function updateWalletUI() {
    const connectBtn = document.getElementById('connectWalletBtn');
    const disconnectBtn = document.getElementById('disconnectWalletBtn');
    const userAddressEl = document.getElementById('userAddress');
    
    console.log('🎨 Updating UI - userAddress:', userAddress);
    console.log('🎨 localStorage walletConnected:', localStorage.getItem('walletConnected'));
    
    // Check if we're on index.html or app.html
    const currentPath = window.location.pathname;
    const isOnHomePage = currentPath.includes('index.html') || 
                         currentPath === '/' || 
                         currentPath.endsWith('/');
    
    if (isOnHomePage) {
        // On home page: Show "Connect Wallet" button UNLESS user has an active session
        const hasSession = localStorage.getItem('walletConnected') === 'true';
        
        if (connectBtn) {
            connectBtn.style.display = 'inline-block';
            connectBtn.textContent = 'Connect Wallet';
            console.log('✅ Home page - Connect button shown');
        }
        if (disconnectBtn) {
            disconnectBtn.style.display = 'none';
            console.log('✅ Home page - Disconnect button hidden');
        }
    } else {
        // On dashboard: Show address and disconnect button if connected
        if (userAddress) {
            // Hide connect, show disconnect
            if (connectBtn) {
                connectBtn.style.display = 'none';
                console.log('✅ Dashboard - Connect button hidden');
            }
            if (disconnectBtn) {
                disconnectBtn.style.display = 'inline-block';
                console.log('✅ Dashboard - Disconnect button shown');
            }
            
            // Display shortened address
            if (userAddressEl) {
                const shortened = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
                userAddressEl.textContent = shortened;
                userAddressEl.title = userAddress;
            }
            
            // Check if user is owner and show admin tab
            checkAndShowAdminTab();
        } else {
            // Show connect, hide disconnect
            if (connectBtn) {
                connectBtn.style.display = 'inline-block';
                console.log('✅ Dashboard - Connect button shown');
            }
            if (disconnectBtn) {
                disconnectBtn.style.display = 'none';
                console.log('✅ Dashboard - Disconnect button hidden');
            }
            if (userAddressEl) userAddressEl.textContent = '';
        }
    }
}

/**
 * Check if connected user is the contract owner
 */
async function checkAndShowAdminTab() {
    if (!salvaContract || !userAddress) return;
    
    try {
        const owner = await salvaContract.getOwner();
        const adminTab = document.querySelector('[data-tab="admin"]');
        
        if (adminTab) {
            if (userAddress.toLowerCase() === owner.toLowerCase()) {
                adminTab.style.display = 'block';
                console.log('✅ Admin access granted');
            } else {
                adminTab.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error checking owner:', error);
    }
}

/**
 * Check if wallet is already connected (SILENT CHECK - NO REDIRECT)
 */
async function checkWalletConnection() {
    const eth = await getMetaMaskProvider();
    if (!eth) {
        console.log('❌ MetaMask not found');
        updateWalletUI();
        return false;
    }

    try {
        // Request accounts without prompting user
        const accounts = await eth.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0) {
            // Set up provider and signer
            provider = new ethers.providers.Web3Provider(eth);
            signer = provider.getSigner();
            userAddress = await signer.getAddress();
            
            // Verify we're on Sepolia
            const network = await provider.getNetwork();
            if (network.chainId !== CONFIG.CHAIN_ID) {
                console.warn(`Wrong network. Expected ${CONFIG.CHAIN_ID}, got ${network.chainId}`);
                // Don't clear state - just warn
            }
            
            // Initialize contract
            salvaContract = new ethers.Contract(CONFIG.SALVA_ADDRESS, CONFIG.SALVA_ABI, signer);
            
            console.log('✅ Wallet silently reconnected:', userAddress);
            updateWalletUI();
            
            return true;
        } else {
            // No accounts - clear state and update UI
            console.log('ℹ️ No accounts found');
            provider = null;
            signer = null;
            userAddress = null;
            salvaContract = null;
            updateWalletUI();
            return false;
        }
    } catch (error) {
        console.error('Silent connection check failed:', error);
        // Clear state on error
        provider = null;
        signer = null;
        userAddress = null;
        salvaContract = null;
        updateWalletUI();
        return false;
    }
}

/**
 * Connect to MetaMask (prompts user)
 */
async function connectMetaMask() {
    // Close wallet modal if open
    closeWalletModal();
    
    if (isConnecting) {
        console.log('⏳ Connection already in progress');
        return false;
    }
    
    const eth = await getMetaMaskProvider();
    
    if (!eth) {
        alert('MetaMask is not installed!\n\nPlease install MetaMask browser extension to use this app.');
        window.open('https://metamask.io/download/', '_blank');
        return false;
    }

    try {
        isConnecting = true;
        showLoading('Connecting to MetaMask...');
        
        // Request account access
        const accounts = await eth.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length === 0) {
            throw new Error('No accounts found');
        }
        
        // Set up provider
        provider = new ethers.providers.Web3Provider(eth);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        
        console.log('✅ User address obtained:', userAddress);
        
        // Check network
        const network = await provider.getNetwork();
        console.log('🌐 Network:', network.chainId);
        
        if (network.chainId !== CONFIG.CHAIN_ID) {
            hideLoading();
            showNotification(`Please switch to ${CONFIG.CHAIN_NAME} in MetaMask`, 'error');
            
            // Try to switch network
            try {
                await eth.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: `0x${CONFIG.CHAIN_ID.toString(16)}` }],
                });
                // After network switch, reconnect
                console.log('🔄 Network switched, reconnecting...');
                isConnecting = false;
                return await connectMetaMask();
            } catch (switchError) {
                console.error('Failed to switch network:', switchError);
                isConnecting = false;
                return false;
            }
        }
        
        // Initialize contract
        salvaContract = new ethers.Contract(CONFIG.SALVA_ADDRESS, CONFIG.SALVA_ABI, signer);
        
        // Store connection state
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('lastConnectedAddress', userAddress);
        
        console.log('✅ Connected successfully:', userAddress);
        console.log('✅ Contract initialized:', salvaContract.address);
        
        hideLoading();
        updateWalletUI();
        
        showNotification('Wallet connected! Redirecting to dashboard...', 'success');
        
        console.log('🚀 Redirecting to app.html in 500ms...');
        
        // IMMEDIATE redirect to dashboard after successful connection
        setTimeout(() => {
            console.log('🚀 NOW redirecting to app.html');
            window.location.href = 'app.html';
        }, 500);
        
        return true;
        
    } catch (error) {
        console.error('❌ Connection error:', error);
        hideLoading();
        
        if (error.code === 4001) {
            showNotification('Connection rejected by user', 'error');
        } else if (error.code === -32002) {
            showNotification('Connection request already pending. Please check MetaMask.', 'warning');
        } else {
            showNotification('Failed to connect wallet: ' + error.message, 'error');
        }
        
        isConnecting = false;
        return false;
    } finally {
        // Don't reset isConnecting here if we're about to redirect
        if (!userAddress) {
            isConnecting = false;
        }
    }
}

/**
 * Disconnect wallet
 */
function disconnectWallet() {
    console.log('👋 Disconnecting wallet...');
    
    // Clear all global state
    provider = null;
    signer = null;
    userAddress = null;
    salvaContract = null;
    
    // Clear all localStorage
    localStorage.clear(); // Clear everything to be safe
    
    // Also try to clear session storage
    sessionStorage.clear();
    
    console.log('✅ State cleared');
    
    showNotification('Wallet disconnected', 'success');
    
    // Small delay then redirect and force reload
    setTimeout(() => {
        window.location.href = 'index.html';
        // Force a hard reload to clear any cached state
        setTimeout(() => {
            window.location.reload(true);
        }, 100);
    }, 300);
}

/**
 * Initialize wallet buttons
 */
function initWalletButtons() {
    const connectBtn = document.getElementById('connectWalletBtn');
    const disconnectBtn = document.getElementById('disconnectWalletBtn');
    
    if (connectBtn) {
        // Remove old listeners by cloning
        const newConnectBtn = connectBtn.cloneNode(true);
        connectBtn.parentNode.replaceChild(newConnectBtn, connectBtn);
        
        // Add fresh listener - shows wallet selection modal or redirects
        newConnectBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('🔌 Connect button clicked');
            
            // Check if we're already connected
            if (userAddress && salvaContract) {
                console.log('✅ Already connected, redirecting to dashboard');
                window.location.href = 'app.html';
            } else {
                // Not connected, show wallet modal
                console.log('❌ Not connected, showing wallet modal');
                showWalletModal();
            }
        });
    }
    
    if (disconnectBtn) {
        const newDisconnectBtn = disconnectBtn.cloneNode(true);
        disconnectBtn.parentNode.replaceChild(newDisconnectBtn, disconnectBtn);
        
        newDisconnectBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔌 Disconnect button clicked');
            disconnectWallet();
        });
    }
}

/**
 * Setup MetaMask event listeners
 */
function setupMetaMaskListeners() {
    const eth = window.ethereum;
    if (!eth) return;
    
    // Account changed
    eth.on('accountsChanged', async (accounts) => {
        console.log('👤 Account changed:', accounts);
        
        if (accounts.length === 0) {
            // User disconnected
            disconnectWallet();
        } else {
            // User switched account - reload to update
            localStorage.setItem('walletConnected', 'true');
            window.location.reload();
        }
    });
    
    // Chain changed
    eth.on('chainChanged', (chainId) => {
        console.log('⛓️ Chain changed:', chainId);
        // Reload page on chain change
        window.location.reload();
    });
}

// Export functions to window scope
window.showNotification = showNotification;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.checkWalletConnection = checkWalletConnection;
window.connectMetaMask = connectMetaMask;
window.disconnectWallet = disconnectWallet;
window.initWalletButtons = initWalletButtons;
window.setupMetaMaskListeners = setupMetaMaskListeners;
window.updateWalletUI = updateWalletUI;
window.showWalletModal = showWalletModal;
window.closeWalletModal = closeWalletModal;