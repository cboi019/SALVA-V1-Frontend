// FILE: js/ui/render.js

function formatAmount(amount, decimals = 18, symbol = '') {
    const num = parseFloat(ethers.utils.formatUnits(amount, decimals));

    // If amount is very small, show more decimals
    if (num < 0.01 && num > 0) {
        return `${num.toFixed(6)} ${symbol}`.trim();
    }
    // If amount is less than 1, show 4 decimals
    else if (num < 1) {
        return `${num.toFixed(4)} ${symbol}`.trim();
    }
    // For normal amounts, show 2 decimals
    else {
        return `${num.toFixed(2)} ${symbol}`.trim();
    }
}

// Render plan card
async function renderPlanCard(planId, planData, type, tokenDecimals = 18) {
    const container = document.getElementById('plansContainer');

    if (container.children.length === 1 && container.children[0].tagName === 'P') {
        container.innerHTML = ''; // Clear the "Loading..." or "No active plans..." message
    }

    // Remove empty state if exists
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    // Check if card already exists
    let card = document.getElementById(`plan-${planId}`);

    if (!card) {
        card = document.createElement('div');
        card.id = `plan-${planId}`;
        card.className = 'plan-card';
        container.appendChild(card);
    }

    // Get token symbol
    let tokenSymbol = 'tokens';
    try {
        const tokenContract = new ethers.Contract(planData.token, CONFIG.ERC20_ABI, provider);
        tokenSymbol = await tokenContract.symbol();
    } catch (error) {
        console.error('Error getting token symbol:', error);
    }

    // Build card content
    if (type === 'time') {
        card.innerHTML = await renderTimeBasedCard(planId, planData, tokenDecimals, tokenSymbol);
    } else {
        card.innerHTML = await renderGoalBasedCard(planId, planData, tokenDecimals, tokenSymbol);
    }
}

// Render Time-Based Plan Card
// FILE: js/ui/render.js - Update renderTimeBasedCard function

async function renderTimeBasedCard(planId, plan, decimals, symbol) {
    const now = Math.floor(Date.now() / 1000);
    const maturityTime = plan.maturityTime.toNumber();
    const timeLeft = maturityTime - now;

    // Better time display
    let timeDisplay;
    if (timeLeft <= 0) {
        timeDisplay = 'Mature ✓';
    } else {
        const daysLeft = Math.floor(timeLeft / 86400);
        const hoursLeft = Math.floor((timeLeft % 86400) / 3600);
        const minutesLeft = Math.floor((timeLeft % 3600) / 60);

        if (daysLeft > 0) {
            timeDisplay = `${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
        } else if (hoursLeft > 0) {
            timeDisplay = `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`;
        } else if (minutesLeft > 0) {
            timeDisplay = `${minutesLeft} min`;
        } else {
            timeDisplay = 'Less than 1 min';
        }
    }

    const isComplete = plan.isComplete || timeLeft <= 0;

    return `
        <div class="plan-header">
            <span class="plan-type-badge time-based">🕐 Time-Based</span>
            <span class="plan-id">ID: ${planId}</span>
        </div>
        
        <div class="plan-description">${plan.description}</div>
        
        <div class="plan-info">
            <div class="plan-info-row">
                <span class="plan-info-label">Token:</span>
                <span class="plan-info-value">${symbol}</span>
            </div>
            <div class="plan-info-row">
                <span class="plan-info-label">Current Balance:</span>
                <span class="plan-info-value">${formatAmount(plan.currentAmount, decimals, symbol)}</span>
            </div>
            <div class="plan-info-row">
                <span class="plan-info-label">Time Left:</span>
                <span class="plan-info-value ${timeLeft <= 0 ? 'mature-text' : ''}">${timeDisplay}</span>
            </div>
            <div class="plan-info-row">
                <span class="plan-info-label">Maturity Date:</span>
                <span class="plan-info-value">${new Date(maturityTime * 1000).toLocaleDateString()}</span>
            </div>
        </div>
        
        <div class="plan-status ${isComplete ? 'complete' : 'active'}">
            ${isComplete ? '✓ Ready to Withdraw' : '🔒 Locked'}
        </div>
        
        <div class="plan-actions">
            ${!isComplete ? `
                <button class="btn btn-small btn-success" onclick="showFundModal('${planId}', 'time', '${plan.token}', ${decimals}, '${symbol}')">
                    Fund Plan
                </button>
            ` : ''}
            ${isComplete && plan.currentAmount.gt(0) ? `
                <button class="btn btn-small btn-primary" onclick="showWithdrawModal('${planId}', 'time', '${ethers.utils.formatUnits(plan.currentAmount, decimals)}', ${decimals}, '${symbol}')">
                    Withdraw
                </button>
            ` : ''}
        </div>
    `;
}

// Render Goal-Based Plan Card
async function renderGoalBasedCard(planId, plan, decimals, symbol) {
    const currentAmount = parseFloat(ethers.utils.formatUnits(plan.currentAmount, decimals));
    const targetAmount = parseFloat(ethers.utils.formatUnits(plan.targetAmount, decimals));
    const progress = (currentAmount / targetAmount) * 100;
    const amountLeft = Math.max(0, targetAmount - currentAmount);
    const isComplete = plan.isComplete;

    return `
        <div class="plan-header">
            <span class="plan-type-badge goal-based">🎯 Goal-Based</span>
            <span class="plan-id">ID: ${planId}</span>
        </div>
        
        <div class="plan-description">${plan.description}</div>
        
        <div class="plan-info">
            <div class="plan-info-row">
                <span class="plan-info-label">Token:</span>
                <span class="plan-info-value">${symbol}</span>
            </div>
            <div class="plan-info-row">
                <span class="plan-info-label">Current Amount:</span>
                <span class="plan-info-value">${formatAmount(plan.currentAmount, decimals, symbol)}</span>
            </div>
            <div class="plan-info-row">
                <span class="plan-info-label">Target Amount:</span>
                <span class="plan-info-value">${formatAmount(plan.targetAmount, decimals, symbol)}</span>
            </div>
            <div class="plan-info-row">
                <span class="plan-info-label">Amount Left:</span>
                <span class="plan-info-value">${amountLeft < 0.01 && amountLeft > 0 ? amountLeft.toFixed(6) : amountLeft.toFixed(2)} ${symbol}</span>
            </div>
        </div>
        
        <div class="progress-container">
            <div class="progress-label">
                <span>Progress</span>
                <span>${Math.min(100, progress.toFixed(1))}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(100, progress)}%"></div>
            </div>
        </div>
        
        <div class="plan-status ${isComplete ? 'complete' : 'active'}">
            ${isComplete ? '✓ Goal Achieved!' : '🎯 In Progress'}
        </div>
        
        <div class="plan-actions">
            ${!isComplete ? `
                <button class="btn btn-small btn-success" onclick="showFundModal('${planId}', 'goal', '${plan.token}', ${decimals}, '${symbol}')">
                    Fund Plan
                </button>
            ` : ''}
            ${isComplete && plan.currentAmount.gt(0) ? `
                <button class="btn btn-small btn-primary" onclick="showWithdrawModal('${planId}', 'goal', '${ethers.utils.formatUnits(plan.currentAmount, decimals)}', ${decimals}, '${symbol}')">
                    Withdraw
                </button>
            ` : ''}
        </div>
    `;
}

// Remove plan from UI
function removePlanFromUI(planId) {
    const card = document.getElementById(`plan-${planId}`);
    if (card) {
        card.remove();

        // Check if plans container is empty
        const container = document.getElementById('plansContainer');
        if (container.children.length === 0) {
            container.innerHTML = '<p class="empty-state">No active plans. Create your first commitment!</p>';
        }

        updateTotalBalance();
    }
}

// Render tokens list
function renderTokensList(tokens) {
    const container = document.getElementById('tokensContainer');

    if (tokens.length === 0) {
        container.innerHTML = '<p class="empty-state">No tokens whitelisted yet.</p>';
        return;
    }

    container.innerHTML = tokens.map(token => `
        <div class="token-item">
            <div class="token-info">
                <div class="token-name">${token.name}</div>
                <div class="token-address" title="${token.address}">
                    ${token.address.slice(0, 10)}...${token.address.slice(-8)}
                </div>
            </div>
            <span class="token-badge">✓ Whitelisted</span>
        </div>
    `).join('');
}

// Update total balance across all plans
async function updateTotalBalance() {
    const balanceEl = document.getElementById('totalBalance');
    
    try {
        // Check if contract exists
        if (!salvaContract || !userAddress) {
            console.log('⚠️ Contract or user not initialized yet');
            if (balanceEl) balanceEl.textContent = '---';
            return;
        }
        
        const plans = getPlanIds();
        
        console.log('📊 Updating balance for', plans.length, 'plans');
        
        if (plans.length === 0) {
            if (balanceEl) balanceEl.textContent = '0.00 USD';
            return;
        }
        
        let totalValueInUSD = 0;
        const balancesByToken = {};

        for (const plan of plans) {
            try {
                let planData;

                if (plan.type === 'time') {
                    planData = await salvaContract.viewTimeBasedPlan(userAddress, plan.id);
                } else {
                    planData = await salvaContract.viewGoalBasedPlan(userAddress, plan.id);
                }

                const tokenAddress = planData.token;

                if (!balancesByToken[tokenAddress]) {
                    const decimals = await getTokenDecimals(tokenAddress);
                    const tokenContract = new ethers.Contract(tokenAddress, CONFIG.ERC20_ABI, provider);
                    const symbol = await tokenContract.symbol();

                    balancesByToken[tokenAddress] = {
                        balance: ethers.BigNumber.from(0),
                        decimals,
                        symbol
                    };
                }

                balancesByToken[tokenAddress].balance = balancesByToken[tokenAddress].balance.add(planData.currentAmount);
                
            } catch (error) {
                console.error('Error processing plan', plan.id, ':', error);
                // Continue with other plans even if one fails
            }
        }

        // Sum the amounts
        for (const { balance, decimals } of Object.values(balancesByToken)) {
            const tokenAmount = parseFloat(ethers.utils.formatUnits(balance, decimals));
            totalValueInUSD += tokenAmount;
        }

        if (balanceEl) {
            if (Object.keys(balancesByToken).length === 0) {
                balanceEl.textContent = '0.00 USD';
            } else {
                balanceEl.textContent = `${totalValueInUSD.toFixed(2)} USD`;
            }
        }
        
        console.log('✅ Balance updated:', totalValueInUSD.toFixed(2), 'USD');

    } catch (error) {
        console.error('❌ Error updating total balance:', error);
        if (balanceEl) {
            balanceEl.textContent = '---';
        }
    }
}

// Show fund modal (prompt) - UPDATED with decimals
function showFundModal(planId, type, tokenAddress, decimals, symbol) {
    const amount = prompt(`Enter amount to fund (${symbol}):`);

    if (amount && parseFloat(amount) > 0) {
        const amountWei = ethers.utils.parseUnits(amount, decimals);

        if (type === 'time') {
            fundTimeBasedPlan(tokenAddress, planId, amountWei);
        } else {
            fundGoalBasedPlan(tokenAddress, planId, amountWei);
        }
    }
}

// Show withdraw modal (prompt) - UPDATED with decimals
function showWithdrawModal(planId, type, maxAmount, decimals, symbol) {
    const amount = prompt(`Enter amount to withdraw (Max: ${maxAmount} ${symbol}):`);

    if (amount && parseFloat(amount) > 0) {
        const amountWei = ethers.utils.parseUnits(amount, decimals);

        if (type === 'time') {
            withdrawFromTBS(planId, amountWei);
        } else {
            withdrawFromGBS(planId, amountWei);
        }
    }
}

// Helper function to get token decimals
async function getTokenDecimals(tokenAddress) {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, CONFIG.ERC20_ABI, provider);
        const decimals = await tokenContract.decimals();
        return decimals;
    } catch (error) {
        console.error('Error getting decimals:', error);
        return 18; // Default fallback
    }
}