// wallet.js - FINAL REWRITE: State Alignment Fix

// NOTE: This script assumes global variables (provider, signer, userAddress, salvaContract)
// and utility functions (showLoading, hideLoading, showNotification, initWalletConnect, 
// disconnectWalletConnect, checkWalletConnectConnection) and the CONFIG object are 
// declared and loaded in scripts BEFORE this one.

let isConnecting = false;

// Connect wallet (Handles connection for ANY detected injected provider)
async function connectWallet() {
    if (isConnecting) {
        console.log('Connection already in progress...');
        return;
    }
    
    try {
        isConnecting = true;
        
        let injectedProvider = null;

        // --- Rabby/Multi-Wallet Fix: Prioritize Rabby if available ---
        if (window.ethereum && window.ethereum.isRabby) {
            injectedProvider = window.ethereum; // Rabby is often the default
            console.log("Rabby Wallet detected.");
        } 
        // Fallback for when MetaMask or another provider is default
        else if (window.ethereum) {
            injectedProvider = window.ethereum;
            console.log("Generic/MetaMask provider detected.");
        }

        // Check if ANY injected Web3 provider is available
        if (!injectedProvider) {
            alert('No Web3 wallet detected! Please install a wallet like MetaMask, Rabby, or Coinbase Wallet.');
            window.open('https://metamask.io/download/', '_blank');
            isConnecting = false;
            return;
        }

        showLoading('Connecting wallet...');

        // Request account access using the selected injected provider
        const accounts = await injectedProvider.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length === 0) {
            hideLoading();
            isConnecting = false;
            return;
        }

        // Create provider and signer using the selected injected provider
        provider = new ethers.providers.Web3Provider(injectedProvider);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();

        // Check network (logic remains the same, but uses the injectedProvider for requests)
        const network = await provider.getNetwork();
        if (network.chainId !== CONFIG.CHAIN_ID) {
            try {
                await injectedProvider.request({ // Use injectedProvider here
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: ethers.utils.hexValue(CONFIG.CHAIN_ID) }],
                });
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                provider = new ethers.providers.Web3Provider(injectedProvider);
                signer = provider.getSigner();
                
            } catch (error) {
                hideLoading();
                isConnecting = false;
                alert(`Please switch to ${CONFIG.CHAIN_NAME} in your wallet`);
                return;
            }
        }

        // Initialize contract
        salvaContract = new ethers.Contract(CONFIG.SALVA_ADDRESS, CONFIG.SALVA_ABI, signer);

        // Store connection
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletType', 'injected'); // <--- CRITICAL: Set to 'injected'

        // Update UI
        updateWalletUI();

        hideLoading();
        isConnecting = false;

        // Redirect logic remains the same
        const currentPath = window.location.pathname;
        const isOnHomePage = currentPath.includes('index.html') || 
                             currentPath === '/' || 
                             currentPath.endsWith('/SALVA-V1-Frontend/') ||
                             currentPath === '/SALVA-V1-Frontend';

        if (isOnHomePage) {
            const base = window.location.origin + window.location.pathname.replace(/index\.html.*$/, '');
            window.location.href = base + 'app.html';
        }

        showNotification('Wallet connected successfully!', 'success');
        
        // Execute other required setup functions
        if (typeof loadUserPlansFromEvents === 'function') await loadUserPlansFromEvents();
        if (typeof loadWhitelistedTokens === 'function') await loadWhitelistedTokens();


    } catch (error) {
        hideLoading();
        isConnecting = false;
        console.error('Connection error:', error);
        
        if (error.code === 4001 || (error.message && error.message.includes('User rejected'))) {
            showNotification('Connection cancelled', 'error');
        } else {
            showNotification('Failed to connect wallet', 'error');
        }
    }
}

// Disconnect wallet
function disconnectWallet() {
    provider = null;
    signer = null;
    userAddress = null;
    salvaContract = null;
    isConnecting = false;

    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletType');

    // Redirect to home
    window.location.href = 'index.html';
}

// Update wallet UI
function updateWalletUI() {
    const connectBtn = document.getElementById('connectWalletBtn');
    const disconnectBtn = document.getElementById('disconnectWalletBtn');
    const userAddressEl = document.getElementById('userAddress');

    if (userAddress) {
        if (connectBtn) connectBtn.style.display = 'none';
        if (disconnectBtn) disconnectBtn.style.display = 'block';

        // Show shortened address
        if (userAddressEl) {
            const shortAddress = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
            userAddressEl.textContent = shortAddress;
        }

        // Show admin tab if owner
        if (userAddress && CONFIG.OWNER_ADDRESS) {
            if (userAddress.toLowerCase() === CONFIG.OWNER_ADDRESS.toLowerCase()) {
                const adminTabBtn = document.querySelector('.tab-btn[data-tab="admin"]');
                if (adminTabBtn) {
                    adminTabBtn.style.display = 'block';
                    console.log('Admin tab enabled for owner');
                }
            } else {
                const adminTabBtn = document.querySelector('.tab-btn[data-tab="admin"]');
                if (adminTabBtn) {
                    adminTabBtn.style.display = 'none';
                }
            }
        }
    } else {
        if (connectBtn) connectBtn.style.display = 'block';
        if (disconnectBtn) disconnectBtn.style.display = 'none';
    }
}

// Check if wallet is connected on page load - FIXED VERSION
async function checkWalletConnection() {
    // Don't auto-connect if already connecting
    if (isConnecting) return;

    const isConnected = localStorage.getItem('walletConnected');
    const walletType = localStorage.getItem('walletType');

    if (!isConnected) return;

    try {
        // Check WalletConnect first
        if (walletType === 'walletconnect') {
            const wcConnected = await checkWalletConnectConnection();
            if (wcConnected) return;
        }

        // --- FIX 1: Check for 'injected' walletType (to match stored state) ---
        if (walletType === 'injected' && window.ethereum) {
            // Check if there are any connected accounts
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });

            if (accounts.length > 0) {
                // Silently reconnect without showing modal
                isConnecting = true;

                provider = new ethers.providers.Web3Provider(window.ethereum);
                signer = provider.getSigner();
                userAddress = await signer.getAddress();

                // Check network
                const network = await provider.getNetwork();
                if (network.chainId !== CONFIG.CHAIN_ID) {
                    // Wrong network - clear connection and let user reconnect manually
                    localStorage.removeItem('walletConnected');
                    localStorage.removeItem('walletType');
                    isConnecting = false;
                    return;
                }

                salvaContract = new ethers.Contract(CONFIG.SALVA_ADDRESS, CONFIG.SALVA_ABI, signer);
                updateWalletUI();

                isConnecting = false;
                console.log('Wallet reconnected silently');
            } else {
                // No accounts - clear connection
                localStorage.removeItem('walletConnected');
                localStorage.removeItem('walletType');
            }
        }
    } catch (error) {
        console.error('Error checking wallet:', error);
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletType');
        isConnecting = false;
    }
}

// Detect if mobile
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Show wallet selection modal
function showWalletModal() {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'wallet-modal';
    
    // Auto-connect if in mobile wallet browser
    const ua = navigator.userAgent.toLowerCase();
    const inWalletBrowser = isMobile() && (ua.includes('trust') || ua.includes('metamask') || ua.includes('rabby') || ua.includes('coinbase'));

    if (inWalletBrowser && window.ethereum) {
         console.log('Wallet browser detected - auto-connecting.');
         connectWallet(); 
         return;
    }
    
    // Modal HTML (Hardcoded MetaMask/WalletConnect options)
    modal.innerHTML = `
        <div class="wallet-modal-content">
            <h3>Connect Wallet</h3>
            <button class="wallet-option" id="metamaskOption">
                <span>🦊</span>
                <div>
                    <strong>MetaMask</strong>
                    <small>Connect using MetaMask</small>
                </div>
            </button>
            <button class="wallet-option" id="walletconnectOption">
                <span>🔗</span>
                <div>
                    <strong>WalletConnect</strong>
                    <small>Scan with any mobile wallet</small>
                </div>
            </button>
            <button class="wallet-close" id="closeWalletModal">✕</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    document.getElementById('metamaskOption').addEventListener('click', async () => {
        modal.remove();
        // Since connectWallet handles Rabby/MetaMask priority, this is fine
        await connectWallet(); 
    });

    document.getElementById('walletconnectOption').addEventListener('click', async () => {
        modal.remove();
        // Store WC type before connecting
        localStorage.setItem('walletType', 'walletconnect');
        await initWalletConnect();
    });

    document.getElementById('closeWalletModal').addEventListener('click', () => {
        modal.remove();
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Initialize wallet buttons
function initWalletButtons() {
    const connectBtn = document.getElementById('connectWalletBtn');
    const disconnectBtn = document.getElementById('disconnectWalletBtn');

    if (connectBtn) {
        connectBtn.addEventListener('click', () => {
            showWalletModal();
        });
    }

    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', () => {
            const walletType = localStorage.getItem('walletType');
            if (walletType === 'walletconnect') {
                disconnectWalletConnect();
            } else {
                // This covers the generic 'injected' type
                disconnectWallet();
            }
        });
    }

    // Check connection on load (only once)
    checkWalletConnection();

    // Listen for account and chain changes (Works for ANY standard injected wallet)
    if (window.ethereum) {
        // Remove any existing listeners first to prevent duplicates on page re-run
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');

        window.ethereum.on('accountsChanged', (accounts) => {
            const walletType = localStorage.getItem('walletType');

            // --- FIX 2: Check for only 'injected' type (as stored in connectWallet) ---
            const isConnectedInjected = (walletType === 'injected');

            if (isConnectedInjected) {
                if (accounts.length === 0) {
                    // Wallet locked or disconnected from the extension side
                    disconnectWallet();
                } else if (!isConnecting) {
                    // Account changed (switched address in the wallet) - reload page
                    window.location.reload();
                }
            }
        });

        window.ethereum.on('chainChanged', () => {
            const walletType = localStorage.getItem('walletType');

            // --- FIX 2: Check for only 'injected' type ---
            const isConnectedInjected = (walletType === 'injected');

            if (isConnectedInjected && !isConnecting) {
                // Chain changed (user switched networks) - reload page
                window.location.reload();
            }
        });
    }
}

// Utility functions (Same as before)
function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showLoading(message = 'Processing transaction...') {
    const modal = document.getElementById('loadingModal');
    const text = document.getElementById('loadingText');

    if (modal) {
        if (text) text.textContent = message;
        modal.classList.add('show');
    }
}

function hideLoading() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.classList.remove('show');
    }
}