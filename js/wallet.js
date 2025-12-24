// wallet.js - MetaMask ONLY version
let isConnecting = false;

// Check if on mobile device
function isMobileDevice() {
    return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

// Check if in MetaMask mobile browser
function isMetaMaskBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('metamask') || 
           (isMobileDevice() && window.ethereum?.isMetaMask);
}

// Connect to MetaMask
async function connectMetaMask() {
    if (isConnecting) {
        console.log('Connection already in progress...');
        return;
    }
    
    // Check if MetaMask is available
    if (!window.ethereum) {
        alert('MetaMask is not installed! Please install MetaMask to continue.');
        window.open('https://metamask.io/download/', '_blank');
        return;
    }
    
    try {
        isConnecting = true;
        showLoading('Connecting to MetaMask...');

        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length === 0) {
            hideLoading();
            isConnecting = false;
            return;
        }

        // Create provider and signer
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();

        console.log('Connected address:', userAddress);

        // Check network
        const network = await provider.getNetwork();
        console.log('Current network:', network.chainId, 'Expected:', CONFIG.CHAIN_ID);
        
        if (network.chainId !== CONFIG.CHAIN_ID) {
            try {
                console.log('Requesting network switch to Sepolia...');
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: ethers.utils.hexValue(CONFIG.CHAIN_ID) }],
                });
                
                console.log('Network switch requested, waiting...');
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Recreate provider after network switch
                provider = new ethers.providers.Web3Provider(window.ethereum);
                signer = provider.getSigner();
                
                console.log('Network switched successfully');
                
            } catch (error) {
                console.error('Network switch error:', error);
                hideLoading();
                isConnecting = false;
                
                if (error.code === 4902) {
                    alert('Sepolia Testnet is not configured in your MetaMask. Please add it manually.');
                } else {
                    alert('Please switch to Sepolia Testnet in your MetaMask wallet.');
                }
                return;
            }
        }

        // Initialize contract
        salvaContract = new ethers.Contract(CONFIG.SALVA_ADDRESS, CONFIG.SALVA_ABI, signer);
        console.log('Contract initialized:', salvaContract.address);

        // Store connection
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletType', 'metamask');

        // Update UI
        updateWalletUI();

        hideLoading();
        
        // Small delay before setting isConnecting to false
        await new Promise(resolve => setTimeout(resolve, 100));
        isConnecting = false;

        // Redirect if on home page
        const currentPath = window.location.pathname;
        const isOnHomePage = currentPath.includes('index.html') || 
                             currentPath === '/' || 
                             currentPath.endsWith('/SALVA-V1-Frontend/') ||
                             currentPath === '/SALVA-V1-Frontend';

        if (isOnHomePage) {
            const base = window.location.origin + window.location.pathname.replace(/index\.html.*$/, '');
            console.log('Redirecting to app.html...');
            window.location.href = base + 'app.html';
            return;
        }

        showNotification('Connected to MetaMask!', 'success');
        
        // Trigger app initialization if we're already on app.html
        if (typeof loadUserPlansFromEvents === 'function') {
            console.log('Triggering app data load...');
            await loadUserPlansFromEvents();
        }
        if (typeof loadWhitelistedTokens === 'function') {
            await loadWhitelistedTokens();
        }

    } catch (error) {
        hideLoading();
        isConnecting = false;
        console.error('Connection error:', error);
        
        if (error.code === 4001 || (error.message && error.message.includes('User rejected'))) {
            showNotification('Connection cancelled', 'error');
        } else if (error.code === -32002) {
            showNotification('Connection request already pending. Please check MetaMask.', 'error');
        } else {
            showNotification('Failed to connect to MetaMask', 'error');
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

        if (userAddressEl) {
            const shortAddress = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
            userAddressEl.textContent = shortAddress;
        }

        // Show admin tab if owner
        if (CONFIG.OWNER_ADDRESS && userAddress.toLowerCase() === CONFIG.OWNER_ADDRESS.toLowerCase()) {
            const adminTabBtn = document.querySelector('.tab-btn[data-tab="admin"]');
            if (adminTabBtn) adminTabBtn.style.display = 'block';
        }
    } else {
        if (connectBtn) connectBtn.style.display = 'block';
        if (disconnectBtn) disconnectBtn.style.display = 'none';
    }
}

// Check wallet connection on page load
async function checkWalletConnection() {
    if (isConnecting) return;

    const isConnected = localStorage.getItem('walletConnected');
    if (!isConnected) return;

    try {
        // Check injected wallet
        if (window.ethereum) {
            // Give MetaMask time to fully inject (important on mobile)
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });

            if (accounts.length > 0) {
                isConnecting = true;

                provider = new ethers.providers.Web3Provider(window.ethereum);
                signer = provider.getSigner();
                userAddress = await signer.getAddress();

                // Check network
                const network = await provider.getNetwork();
                console.log('Connected to network:', network.chainId, 'Expected:', CONFIG.CHAIN_ID);
                
                if (network.chainId !== CONFIG.CHAIN_ID) {
                    console.warn('Wrong network. User will be prompted to switch.');
                }

                salvaContract = new ethers.Contract(CONFIG.SALVA_ADDRESS, CONFIG.SALVA_ABI, signer);
                updateWalletUI();

                isConnecting = false;
                console.log('Wallet reconnected silently');

                // ADD THIS: Redirect if on home page
                const currentPath = window.location.pathname;
                const isOnHomePage = currentPath.includes('index.html') || 
                                     currentPath === '/' || 
                                     currentPath.endsWith('/SALVA-V1-Frontend/') ||
                                     currentPath === '/SALVA-V1-Frontend';

                if (isOnHomePage) {
                    const base = window.location.origin + window.location.pathname.replace(/index\.html.*$/, '');
                    console.log('Already connected, redirecting to app.html...');
                    window.location.href = base + 'app.html';
                }

            } else {
                localStorage.removeItem('walletConnected');
                localStorage.removeItem('walletType');
            }
        }
    } catch (error) {
        console.error('Error checking wallet:', error);
        isConnecting = false;
    }
}

// Show connection modal or auto-connect
async function showConnectionUI() {
    console.log('=== CONNECTION DEBUG ===');
    console.log('isMobileDevice:', isMobileDevice());
    console.log('isMetaMaskBrowser:', isMetaMaskBrowser());
    console.log('window.ethereum:', !!window.ethereum);
    
    // If in MetaMask browser, auto-connect
    if (isMetaMaskBrowser()) {
        console.log('MetaMask browser detected - auto-connecting');
        await connectMetaMask();
        return;
    }
    
    // If on mobile with MetaMask, auto-connect
    if (isMobileDevice() && window.ethereum?.isMetaMask) {
        console.log('Mobile MetaMask detected - auto-connecting');
        await connectMetaMask();
        return;
    }
    
    // Desktop: Show modal
    const modal = document.createElement('div');
    modal.className = 'wallet-modal';
    
    let content = '';
    
    if (window.ethereum) {
        // MetaMask detected
        content = `
            <button class="wallet-option" id="connectMetaMask">
                <span>🦊</span>
                <div>
                    <strong>MetaMask</strong>
                    <small>Connect using MetaMask</small>
                </div>
            </button>
        `;
    } else {
        // No MetaMask - show install prompt
        content = `
            <div style="text-align: center; padding: 1rem; color: var(--text-secondary);">
                <p style="margin-bottom: 1rem;">MetaMask is required to use SALVA</p>
                <button class="wallet-option" onclick="window.open('https://metamask.io/download/', '_blank')">
                    <span>📥</span>
                    <div>
                        <strong>Install MetaMask</strong>
                        <small>Get started with Web3</small>
                    </div>
                </button>
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="wallet-modal-content">
            <h3>Connect Wallet</h3>
            ${content}
            <button class="wallet-close" id="closeModal">✕</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    const connectBtn = document.getElementById('connectMetaMask');
    if (connectBtn) {
        connectBtn.addEventListener('click', () => {
            modal.remove();
            connectMetaMask();
        });
    }

    const closeBtn = document.getElementById('closeModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Initialize wallet buttons
async function initWalletButtons() {
    // CRITICAL: Wait for MetaMask injection on mobile
    if (isMobileDevice() && !window.ethereum) {
        console.log('Waiting for MetaMask injection...');
        let attempts = 0;
        while (!window.ethereum && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        if (window.ethereum) {
            console.log('MetaMask injected after', attempts * 100, 'ms');
        } else {
            console.warn('MetaMask not detected after 3 seconds');
        }
    }
    
    const connectBtn = document.getElementById('connectWalletBtn');
    const disconnectBtn = document.getElementById('disconnectWalletBtn');

    if (connectBtn) {
        connectBtn.addEventListener('click', () => {
            showConnectionUI();
        });
    }

    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', () => {
            disconnectWallet();
        });
    }

    // Check connection on load
    await checkWalletConnection();

    // Listen for account and chain changes
    if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');

        window.ethereum.on('accountsChanged', (accounts) => {
            if (localStorage.getItem('walletConnected')) {
                if (accounts.length === 0) {
                    disconnectWallet();
                } else if (!isConnecting) {
                    window.location.reload();
                }
            }
        });

        window.ethereum.on('chainChanged', () => {
            if (localStorage.getItem('walletConnected') && !isConnecting) {
                window.location.reload();
            }
        });
    }
}

// Show notification
function showNotification(message, type = 'success') {
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

// Show loading modal
function showLoading(message = 'Processing transaction...') {
    const modal = document.getElementById('loadingModal');
    const text = document.getElementById('loadingText');

    if (modal) {
        if (text) text.textContent = message;
        modal.classList.add('show');
    }
}

// Hide loading modal
function hideLoading() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.classList.remove('show');
    }
}