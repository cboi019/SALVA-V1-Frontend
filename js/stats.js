// js/stats.js

async function loadProtocolStats() {
    try {
        // Ensure provider and contract are initialized from wallet.js
        if (!salvaContract || !provider) {
            console.log("⏳ Waiting for contract initialization...");
            return;
        }

        console.log("📊 Fetching live protocol stats...");

        // 1. Get the list of whitelisted tokens from Salva
        const whitelistedTokens = await salvaContract.getWhitelistedTokens();
        const listContainer = document.getElementById('statsTokenList');
        listContainer.innerHTML = ''; // Clear the "Loading" placeholder

        let totalTvlNative = 0; // Cumulative TVL (Note: summing different decimals requires price feeds)
        let activePlansCount = 0;

        // 2. Fetch Active Plan Count
        try {
            // Using your existing nextPlanId logic to represent total plans created
            activePlansCount = await salvaContract.nextPlanId();
            document.getElementById('statActivePlans').innerText = activePlansCount.toString();
        } catch (e) {
            console.error("Error fetching plan count:", e);
        }

        // 3. Iterate through tokens to calculate Balance (TVL per asset)
        for (let tokenAddr of whitelistedTokens) {
            const tokenContract = new ethers.Contract(tokenAddr, ERC20_ABI, provider);
            
            // Parallel fetch for speed
            const [symbol, decimals, balance] = await Promise.all([
                tokenContract.symbol(),
                tokenContract.decimals(),
                tokenContract.balanceOf(SALVA_ADDRESS)
            ]);

            const formattedBalance = ethers.utils.formatUnits(balance, decimals);

            // Create UI row for the asset
            const item = document.createElement('div');
            item.className = 'token-item';
            item.innerHTML = `
                <div class="token-info">
                    <span class="token-name">${symbol}</span>
                    <span class="token-address">${tokenAddr.substring(0, 6)}...${tokenAddr.substring(38)}</span>
                </div>
                <div class="token-badge">${parseFloat(formattedBalance).toLocaleString()} Locked</div>
            `;
            listContainer.appendChild(item);
        }

        // Note: For a true USD TVL, you would multiply formattedBalance by a price API (like CoinGecko)
        // For now, we show the assets individually as per your requirement.
        document.getElementById('statTVL').innerText = "Multi-Asset";

    } catch (error) {
        console.error("❌ Failed to load protocol stats:", error);
        document.getElementById('statsTokenList').innerHTML = '<p style="color:var(--error)">Failed to load data from chain.</p>';
    }
}

// Simple poller to initialize once wallet.js is ready
const statsInitInterval = setInterval(() => {
    if (typeof salvaContract !== 'undefined' && salvaContract !== null) {
        loadProtocolStats();
        clearInterval(statsInitInterval);
    }
}, 1000);