// erc20.js
// Check token allowance
async function checkAllowance(tokenAddress, spender) {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, CONFIG.ERC20_ABI, signer);
        const allowance = await tokenContract.allowance(userAddress, spender);
        return allowance;
    } catch (error) {
        console.error('Error checking allowance:', error);
        return ethers.BigNumber.from(0);
    }
}

// Approve token spending
async function approveToken(tokenAddress, spender, amount) {
    try {
        showLoading('Approving token...');
        
        const tokenContract = new ethers.Contract(tokenAddress, CONFIG.ERC20_ABI, signer);
        const tx = await tokenContract.approve(spender, amount);
        
        showLoading('Waiting for confirmation...');
        await tx.wait();
        
        hideLoading();
        showNotification('Token approved successfully!', 'success');
        return true;
    } catch (error) {
        hideLoading();
        console.error('Approval error:', error);
        showNotification('Failed to approve token', 'error');
        return false;
    }
}

// Get token info (symbol, decimals, balance)
async function getTokenInfo(tokenAddress) {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, CONFIG.ERC20_ABI, provider);
        
        const [symbol, decimals, balance] = await Promise.all([
            tokenContract.symbol(),
            tokenContract.decimals(),
            tokenContract.balanceOf(userAddress)
        ]);
        
        return { symbol, decimals, balance };
    } catch (error) {
        console.error('Error getting token info:', error);
        return { symbol: 'UNKNOWN', decimals: 18, balance: ethers.BigNumber.from(0) };
    }
}

// Format token amount (from wei to human readable)
function formatTokenAmount(amount, decimals = 18) {
    return ethers.utils.formatUnits(amount, decimals);
}

// Parse token amount (from human readable to wei)
function parseTokenAmount(amount, decimals = 18) {
    return ethers.utils.parseUnits(amount.toString(), decimals);
}


