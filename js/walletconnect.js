// FILE: js/walletconnect.js

let wcProvider = null;

// Initialize WalletConnect
async function initWalletConnect() {
    try {
        showLoading('Connecting to WalletConnect...');
        
        // Create WalletConnect Provider
        wcProvider = new WalletConnectProvider.default({
            rpc: {
                11155111: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // Public Infura
            },
            chainId: 11155111,
            qrcodeModalOptions: {
                mobileLinks: [
                    "metamask",
                    "trust",
                    "rainbow",
                    "argent",
                    "imtoken",
                    "pillar",
                ],
            },
        });

        // Enable session (triggers QR Code modal)
        await wcProvider.enable();

        // Create ethers provider
        provider = new ethers.providers.Web3Provider(wcProvider);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();

        // Check network
        const network = await provider.getNetwork();
        if (network.chainId !== CONFIG.CHAIN_ID) {
            hideLoading();
            showNotification(`Please switch to ${CONFIG.CHAIN_NAME} in your wallet`, 'error');
            await disconnectWalletConnect();
            return false;
        }

        // Initialize contract
        salvaContract = new ethers.Contract(CONFIG.SALVA_ADDRESS, CONFIG.SALVA_ABI, signer);

        // Store connection
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletType', 'walletconnect');

        // Update UI
        updateWalletUI();

        hideLoading();

        // Redirect to app if on home page
        const currentPath = window.location.pathname;
        const isOnHomePage = currentPath.includes('index.html') || 
                             currentPath === '/' || 
                             currentPath.endsWith('/SALVA-V1-Frontend/') ||
                             currentPath === '/SALVA-V1-Frontend';

        if (isOnHomePage) {
            const base = window.location.origin + window.location.pathname.replace(/index\.html.*$/, '');
            window.location.href = base + 'app.html';
        }

        showNotification('Wallet connected via WalletConnect!', 'success');

        // Subscribe to accounts change
        wcProvider.on("accountsChanged", (accounts) => {
            console.log('Accounts changed:', accounts);
            if (accounts.length === 0) {
                disconnectWalletConnect();
            } else {
                window.location.reload();
            }
        });

        // Subscribe to chainId change
        wcProvider.on("chainChanged", (chainId) => {
            console.log('Chain changed:', chainId);
            window.location.reload();
        });

        // Subscribe to session disconnection
        wcProvider.on("disconnect", (code, reason) => {
            console.log('WalletConnect disconnected:', code, reason);
            disconnectWalletConnect();
        });

        return true;

    } catch (error) {
        hideLoading();
        console.error('WalletConnect error:', error);
        
        if (error.message && error.message.includes('User closed modal')) {
            showNotification('Connection cancelled', 'error');
        } else {
            showNotification('Failed to connect via WalletConnect', 'error');
        }
        
        return false;
    }
}

// Disconnect WalletConnect
async function disconnectWalletConnect() {
    try {
        if (wcProvider) {
            await wcProvider.disconnect();
            wcProvider = null;
        }
    } catch (error) {
        console.error('Error disconnecting WalletConnect:', error);
    }
    
    provider = null;
    signer = null;
    userAddress = null;
    salvaContract = null;
    
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletType');
    
    window.location.href = 'index.html';
}

// Check WalletConnect connection on page load
async function checkWalletConnectConnection() {
    const walletType = localStorage.getItem('walletType');
    
    if (walletType === 'walletconnect' && localStorage.getItem('walletConnected')) {
        try {
            // Try to reconnect
            wcProvider = new WalletConnectProvider.default({
                rpc: {
                    11155111: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
                },
                chainId: 11155111,
            });

            // Check if session exists
            if (wcProvider.connected) {
                provider = new ethers.providers.Web3Provider(wcProvider);
                signer = provider.getSigner();
                userAddress = await signer.getAddress();
                salvaContract = new ethers.Contract(CONFIG.SALVA_ADDRESS, CONFIG.SALVA_ABI, signer);
                updateWalletUI();
                
                // Re-subscribe to events
                wcProvider.on("accountsChanged", (accounts) => {
                    if (accounts.length === 0) {
                        disconnectWalletConnect();
                    } else {
                        window.location.reload();
                    }
                });
                
                wcProvider.on("chainChanged", () => {
                    window.location.reload();
                });
                
                wcProvider.on("disconnect", () => {
                    disconnectWalletConnect();
                });
                
                return true;
            } else {
                // Session expired
                localStorage.removeItem('walletConnected');
                localStorage.removeItem('walletType');
            }
        } catch (error) {
            console.error('Error reconnecting WalletConnect:', error);
            localStorage.removeItem('walletConnected');
            localStorage.removeItem('walletType');
        }
    }
    
    return false;
}