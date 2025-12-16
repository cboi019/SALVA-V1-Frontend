// FILE: js/contracts/salva.js

// Create Time-Based Plan
async function createTimeBasedPlan(tokenAddress, description, durationInDays) {
    try {
        showLoading('Creating time-based plan...');

        const durationInSeconds = durationInDays * 24 * 60 * 60;

        const tx = await salvaContract.createTimeBasedPlan(
            tokenAddress,
            description,
            durationInSeconds
        );

        showLoading('Waiting for confirmation...');
        const receipt = await tx.wait();

        // Listen for planCreated event
        const event = receipt.events.find(e => e.event === 'planCreated');
        if (event) {
            const planId = event.args._planID.toString();

            // Store plan ID with token address
            savePlanId(planId, 'time', tokenAddress);

            // Fetch and display plan
            await fetchAndDisplayPlan(planId, 'time');
        }

        hideLoading();
        showNotification('Time-based plan created successfully!', 'success');

        // Switch to view tab
        switchTab('view');

    } catch (error) {
        hideLoading();
        console.error('Error creating plan:', error);
        showNotification('Failed to create plan', 'error');
    }
}

// Create Goal-Based Plan
async function createGoalBasedPlan(tokenAddress, description, targetAmount) {
    try {
        showLoading('Creating goal-based plan...');

        const tx = await salvaContract.createGoalBasedPlan(
            tokenAddress,
            description,
            targetAmount
        );

        showLoading('Waiting for confirmation...');
        const receipt = await tx.wait();

        // Listen for planCreated event
        const event = receipt.events.find(e => e.event === 'planCreated');
        if (event) {
            const planId = event.args._planID.toString();

            // Store plan ID with token address
            savePlanId(planId, 'goal', tokenAddress);

            // Fetch and display plan
            await fetchAndDisplayPlan(planId, 'goal');
        }

        hideLoading();
        showNotification('Goal-based plan created successfully!', 'success');

        // Switch to view tab
        switchTab('view');

    } catch (error) {
        hideLoading();
        console.error('Error creating plan:', error);
        showNotification('Failed to create plan', 'error');
    }
}

// Fund Time-Based Plan
async function fundTimeBasedPlan(tokenAddress, planId, amount) {
    try {
        // Check allowance first
        const allowance = await checkAllowance(tokenAddress, CONFIG.SALVA_ADDRESS);

        if (allowance.lt(amount)) {
            const approved = await approveToken(tokenAddress, CONFIG.SALVA_ADDRESS, amount);
            if (!approved) return;
        }

        showLoading('Funding plan...');

        const tx = await salvaContract.fundTimeBasedPlan(tokenAddress, planId, amount);

        showLoading('Waiting for confirmation...');
        await tx.wait();

        // Refresh plan display
        await fetchAndDisplayPlan(planId, 'time');

        hideLoading();
        showNotification('Plan funded successfully!', 'success');

    } catch (error) {
        hideLoading();
        console.error('Error funding plan:', error);
        showNotification('Failed to fund plan', 'error');
    }
}

// Fund Goal-Based Plan
async function fundGoalBasedPlan(tokenAddress, planId, amount) {
    try {
        // Check allowance first
        const allowance = await checkAllowance(tokenAddress, CONFIG.SALVA_ADDRESS);

        if (allowance.lt(amount)) {
            const approved = await approveToken(tokenAddress, CONFIG.SALVA_ADDRESS, amount);
            if (!approved) return;
        }

        showLoading('Funding plan...');

        const tx = await salvaContract.fundGoalBasedPlan(tokenAddress, planId, amount);

        showLoading('Waiting for confirmation...');
        await tx.wait();

        // Refresh plan display
        await fetchAndDisplayPlan(planId, 'goal');

        hideLoading();
        showNotification('Plan funded successfully!', 'success');

    } catch (error) {
        hideLoading();
        console.error('Error funding plan:', error);
        showNotification('Failed to fund plan', 'error');
    }
}

// Withdraw from Time-Based Plan
async function withdrawFromTBS(planId, amount) {
    try {
        showLoading('Withdrawing funds...');

        const tx = await salvaContract.withdrawFromTBS(planId, amount);

        showLoading('Waiting for confirmation...');
        const receipt = await tx.wait();

        // Check if plan was deleted (planEnded event)
        const endedEvent = receipt.events.find(e => e.event === 'planEnded');
        if (endedEvent) {
            removePlanId(planId);
            removePlanFromUI(planId);
        } else {
            // Refresh plan display
            await fetchAndDisplayPlan(planId, 'time');
        }

        hideLoading();
        showNotification('Withdrawal successful!', 'success');

    } catch (error) {
        hideLoading();
        console.error('Error withdrawing:', error);

        if (error.message.includes('COMMITMENT_NOT_MATURE')) {
            showNotification('Plan not mature yet!', 'error');
        } else if (error.message.includes('INSUFFICIENT_BALANCE')) {
            showNotification('Insufficient balance in plan', 'error');
        } else {
            showNotification('Failed to withdraw', 'error');
        }
    }
}

// Withdraw from Goal-Based Plan
async function withdrawFromGBS(planId, amount) {
    try {
        showLoading('Withdrawing funds...');

        const tx = await salvaContract.withdrawFromGBS(planId, amount);

        showLoading('Waiting for confirmation...');
        const receipt = await tx.wait();

        // Check if plan was deleted
        const endedEvent = receipt.events.find(e => e.event === 'planEnded');
        if (endedEvent) {
            removePlanId(planId);
            removePlanFromUI(planId);
        } else {
            // Refresh plan display
            await fetchAndDisplayPlan(planId, 'goal');
        }

        hideLoading();
        showNotification('Withdrawal successful!', 'success');

    } catch (error) {
        hideLoading();
        console.error('Error withdrawing:', error);

        if (error.message.includes('COMMITMENT_NOT_MATURE')) {
            showNotification('Goal not reached yet!', 'error');
        } else if (error.message.includes('INSUFFICIENT_BALANCE')) {
            showNotification('Insufficient balance in plan', 'error');
        } else {
            showNotification('Failed to withdraw', 'error');
        }
    }
}

// Fetch and display plan data
async function fetchAndDisplayPlan(planId, type) {
    try {
        let planData;

        if (type === 'time') {
            planData = await salvaContract.viewTimeBasedPlan(userAddress, planId);
        } else {
            planData = await salvaContract.viewGoalBasedPlan(userAddress, planId);
        }

        if (planData.user === ethers.constants.AddressZero) {
            console.log('Plan', planId, 'was deleted');
            removePlanId(planId);
            return;
        }

        const tokenDecimals = await getTokenDecimals(planData.token);
        renderPlanCard(planId, planData, type, tokenDecimals);

        // DON'T call updateTotalBalance here - let app.js handle it after all plans load

    } catch (error) {
        console.error('Error fetching plan:', error);
        removePlanId(planId);
    }
}

// Add or Remove Token (Owner only)
async function manageToken(tokenAddress, tokenName, isAllowed) {
    try {
        showLoading(isAllowed ? 'Adding token...' : 'Removing token...');

        const tx = await salvaContract.addOrRemoveToken(tokenAddress, tokenName, isAllowed);

        showLoading('Waiting for confirmation...');
        await tx.wait();

        // Refresh token list
        await loadWhitelistedTokens();

        hideLoading();
        showNotification(`Token ${isAllowed ? 'added' : 'removed'} successfully!`, 'success');

    } catch (error) {
        hideLoading();
        console.error('Error managing token:', error);
        showNotification('Failed to manage token', 'error');
    }
}

function updateTokenDropdowns(tokens) {
    const tbSelect = document.getElementById('tbTokenSelect');
    const gbSelect = document.getElementById('gbTokenSelect');

    if (tbSelect) {
        tbSelect.innerHTML = '<option value="">Select a token...</option>';
        tokens.forEach(token => {
            const option = document.createElement('option');
            option.value = token.address;
            option.textContent = token.name;
            tbSelect.appendChild(option);
        });
    }

    if (gbSelect) {
        gbSelect.innerHTML = '<option value="">Select a token...</option>';
        tokens.forEach(token => {
            const option = document.createElement('option');
            option.value = token.address;
            option.textContent = token.name;
            gbSelect.appendChild(option);
        });
    }
}

// Load whitelisted tokens from events
// FILE: js/contracts/salva.js - REPLACE loadWhitelistedTokens function

async function loadWhitelistedTokens() {
    const container = document.getElementById('tokensContainer');
    
    try {
        console.log('🔍 Loading whitelisted tokens...');
        
        // Show loading state
        if (container) {
            container.innerHTML = '<p class="empty-state">Loading tokens...</p>';
        }
        
        // Check if contract exists
        if (!salvaContract) {
            console.error('❌ Contract not initialized!');
            if (container) {
                container.innerHTML = '<p class="empty-state">Error: Contract not initialized</p>';
            }
            return;
        }
        
        // Get all tokenAdded events
        const addFilter = salvaContract.filters.tokenAdded();
        const addEvents = await salvaContract.queryFilter(addFilter);
        console.log('✅ Token Added Events:', addEvents.length);

        // Get all tokenRemoved events
        const removeFilter = salvaContract.filters.tokenRemoved();
        const removeEvents = await salvaContract.queryFilter(removeFilter);
        console.log('✅ Token Removed Events:', removeEvents.length);

        // Collect all unique token addresses and their names from ALL events
        const uniqueTokens = new Map();

        // 1. Collect names and addresses from Added events
        addEvents.forEach(event => {
            const address = event.args._tokenAddress;
            const name = event.args._name;
            uniqueTokens.set(address, { name, address });
            console.log(`  Found token: ${name} (${address})`);
        });
        
        // 2. Add addresses from Removed events if they weren't in Added events
        removeEvents.forEach(event => {
            const address = event.args._tokenAddress;
            if (!uniqueTokens.has(address)) {
                uniqueTokens.set(address, { name: 'Unknown Token', address });
            }
        });

        console.log('🔍 Unique tokens found:', uniqueTokens.size);

        const allowedTokens = [];

        // 3. CHECK CURRENT STATUS ON-CHAIN for every unique token
        for (const [address, { name }] of uniqueTokens.entries()) {
            console.log(`Checking token: ${name} (${address})`);
            const isAllowed = await salvaContract.checkAllowedToken(address);
            console.log(`  -> Allowed: ${isAllowed}`);
            
            if (isAllowed) {
                allowedTokens.push({ name, address, isAllowed: true });
            }
        }

        console.log('✅ Final allowed tokens:', allowedTokens.length);

        // Update dropdowns with tokens
        updateTokenDropdowns(allowedTokens);

        // Render tokens list
        if (allowedTokens.length === 0) {
            console.log('⚠️ No tokens whitelisted');
            if (container) {
                container.innerHTML = '<p class="empty-state">No tokens whitelisted yet. Owner needs to add tokens.</p>';
            }
        } else {
            renderTokensList(allowedTokens);
            console.log('✅ Tokens rendered successfully!');
        }

    } catch (error) {
        console.error('❌ Error loading tokens:', error);
        
        // Show error in UI
        if (container) {
            container.innerHTML = `<p class="empty-state">Error loading tokens. Please refresh the page.</p>`;
        }
        
        // Still try to update dropdowns with empty array
        updateTokenDropdowns([]);
    }
}

// LocalStorage helpers for plan IDs - UPDATED to store token address
function savePlanId(planId, type, tokenAddress) {
    const plans = JSON.parse(localStorage.getItem('salvaPlans') || '{}');
    if (!plans[userAddress]) plans[userAddress] = [];
    plans[userAddress].push({ id: planId, type, token: tokenAddress });
    localStorage.setItem('salvaPlans', JSON.stringify(plans));
}

function getPlanIds() {
    const plans = JSON.parse(localStorage.getItem('salvaPlans') || '{}');
    return plans[userAddress] || [];
}

function removePlanId(planId) {
    const plans = JSON.parse(localStorage.getItem('salvaPlans') || '{}');
    if (plans[userAddress]) {
        plans[userAddress] = plans[userAddress].filter(p => p.id !== planId);
        localStorage.setItem('salvaPlans', JSON.stringify(plans));
    }
}

// Get token decimals
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


