// FILE: js/contracts/salva.js

/**
 * Load user plans by querying blockchain events
 */
async function loadUserPlansFromEvents() {
    try {
        if (typeof showLoading === 'function') showLoading('Loading your commitments...');

        const container = document.getElementById('plansContainer');
        if (!container) return;

        console.log('🔍 Fetching events for:', userAddress);

        // Get all planCreated events for this user
        const filter = salvaContract.filters.planCreated(userAddress);
        const events = await salvaContract.queryFilter(filter);

        console.log('✅ Found events:', events.length);

        if (events.length === 0) {
            if (typeof hideLoading === 'function') hideLoading();
            container.innerHTML = '<p class="empty-state">No active plans. Create your first commitment!</p>';
            return;
        }

        // Sync local storage list with chain for this user
        const allPlans = JSON.parse(localStorage.getItem('salvaPlans') || '{}');
        allPlans[userAddress] = [];

        container.innerHTML = ''; // Clear existing state

        for (const event of events) {
            const planId = event.args._planID.toString();
            
            try {
                // 1. Try fetching as a Time-Based Plan
                const timePlan = await salvaContract.viewTimeBasedPlan(userAddress, planId);

                if (timePlan.user !== ethers.constants.AddressZero && !timePlan.isComplete) {
                    allPlans[userAddress].push({ id: planId, type: 'time', token: timePlan.token });
                    await fetchAndDisplayPlan(planId, 'time');
                    continue; 
                }

                // 2. Try as Goal-Based if time-based isn't valid/active
                const goalPlan = await salvaContract.viewGoalBasedPlan(userAddress, planId);

                if (goalPlan.user !== ethers.constants.AddressZero && !goalPlan.isComplete) {
                    allPlans[userAddress].push({ id: planId, type: 'goal', token: goalPlan.token });
                    await fetchAndDisplayPlan(planId, 'goal');
                }
            } catch (err) {
                console.warn(`Plan ${planId} fetch error:`, err);
            }
        }

        localStorage.setItem('salvaPlans', JSON.stringify(allPlans));
        if (typeof hideLoading === 'function') hideLoading();

    } catch (error) {
        console.error('❌ Error loading plans:', error);
        if (typeof hideLoading === 'function') hideLoading();
        const container = document.getElementById('plansContainer');
        if (container) container.innerHTML = '<p class="empty-state">Error fetching plans. Check console.</p>';
    }
}

/**
 * Create Time-Based Commitment
 */
async function createTimeBasedPlan(tokenAddress, description, durationInDays) {
    try {
        showLoading('Creating time-based plan...');
        const durationInSeconds = durationInDays * 24 * 60 * 60;

        const tx = await salvaContract.createTimeBasedPlan(tokenAddress, description, durationInSeconds);
        showLoading('Waiting for confirmation...');
        const receipt = await tx.wait();

        const event = receipt.events.find(e => e.event === 'planCreated');
        if (event) {
            const planId = event.args._planID.toString();
            savePlanId(planId, 'time', tokenAddress);
            await fetchAndDisplayPlan(planId, 'time');
        }

        hideLoading();
        showNotification('Time-based plan created!', 'success');
        if (typeof switchTab === 'function') switchTab('view');

    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        showNotification('Failed to create plan', 'error');
    }
}

/**
 * Create Goal-Based Commitment
 */
async function createGoalBasedPlan(tokenAddress, description, targetAmount) {
    try {
        showLoading('Creating goal-based plan...');
        const tx = await salvaContract.createGoalBasedPlan(tokenAddress, description, targetAmount);
        
        showLoading('Waiting for confirmation...');
        const receipt = await tx.wait();

        const event = receipt.events.find(e => e.event === 'planCreated');
        if (event) {
            const planId = event.args._planID.toString();
            savePlanId(planId, 'goal', tokenAddress);
            await fetchAndDisplayPlan(planId, 'goal');
        }

        hideLoading();
        showNotification('Goal-based plan created!', 'success');
        if (typeof switchTab === 'function') switchTab('view');

    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        showNotification('Failed to create plan', 'error');
    }
}

async function fundTimeBasedPlan(tokenAddress, planId, amount) {
    try {
        const allowance = await checkAllowance(tokenAddress, CONFIG.SALVA_ADDRESS);
        if (allowance.lt(amount)) {
            const approved = await approveToken(tokenAddress, CONFIG.SALVA_ADDRESS, amount);
            if (!approved) return;
        }
        showLoading('Funding plan...');
        const tx = await salvaContract.fundTimeBasedPlan(tokenAddress, planId, amount);
        await tx.wait();
        await fetchAndDisplayPlan(planId, 'time');
        hideLoading();
        showNotification('Plan funded!', 'success');
    } catch (error) {
        hideLoading();
        showNotification('Funding failed', 'error');
    }
}

async function fundGoalBasedPlan(tokenAddress, planId, amount) {
    try {
        const allowance = await checkAllowance(tokenAddress, CONFIG.SALVA_ADDRESS);
        if (allowance.lt(amount)) {
            const approved = await approveToken(tokenAddress, CONFIG.SALVA_ADDRESS, amount);
            if (!approved) return;
        }
        showLoading('Funding plan...');
        const tx = await salvaContract.fundGoalBasedPlan(tokenAddress, planId, amount);
        await tx.wait();
        await fetchAndDisplayPlan(planId, 'goal');
        hideLoading();
        showNotification('Plan funded!', 'success');
    } catch (error) {
        hideLoading();
        showNotification('Funding failed', 'error');
    }
}

async function withdrawFromTBS(planId, amount) {
    try {
        showLoading('Withdrawing funds...');
        const tx = await salvaContract.withdrawFromTBS(planId, amount);
        const receipt = await tx.wait();
        const endedEvent = receipt.events.find(e => e.event === 'planEnded');
        if (endedEvent) {
            removePlanId(planId);
            removePlanFromUI(planId);
        } else {
            await fetchAndDisplayPlan(planId, 'time');
        }
        hideLoading();
        showNotification('Withdrawal successful!', 'success');
    } catch (error) {
        hideLoading();
        showNotification('Withdrawal failed', 'error');
    }
}

async function withdrawFromGBS(planId, amount) {
    try {
        showLoading('Withdrawing funds...');
        const tx = await salvaContract.withdrawFromGBS(planId, amount);
        const receipt = await tx.wait();
        const endedEvent = receipt.events.find(e => e.event === 'planEnded');
        if (endedEvent) {
            removePlanId(planId);
            removePlanFromUI(planId);
        } else {
            await fetchAndDisplayPlan(planId, 'goal');
        }
        hideLoading();
        showNotification('Withdrawal successful!', 'success');
    } catch (error) {
        hideLoading();
        showNotification('Withdrawal failed', 'error');
    }
}

async function fetchAndDisplayPlan(planId, type) {
    try {
        let planData = type === 'time' 
            ? await salvaContract.viewTimeBasedPlan(userAddress, planId)
            : await salvaContract.viewGoalBasedPlan(userAddress, planId);

        if (planData.user === ethers.constants.AddressZero) {
            removePlanId(planId);
            return;
        }

        const tokenDecimals = await getTokenDecimals(planData.token);
        if (typeof renderPlanCard === 'function') {
            renderPlanCard(planId, planData, type, tokenDecimals);
        }
    } catch (error) {
        console.error('Fetch plan details error:', error);
    }
}

async function loadWhitelistedTokens() {
    const container = document.getElementById('tokensContainer');
    try {
        if (container) container.innerHTML = '<p class="empty-state">Loading tokens...</p>';
        if (!salvaContract) return;

        const addFilter = salvaContract.filters.tokenAdded();
        const addEvents = await salvaContract.queryFilter(addFilter);
        const uniqueTokens = new Map();

        addEvents.forEach(event => {
            uniqueTokens.set(event.args._tokenAddress, { 
                name: event.args._name, 
                address: event.args._tokenAddress 
            });
        });

        const allowedTokens = [];
        for (const [address, { name }] of uniqueTokens.entries()) {
            const isAllowed = await salvaContract.checkAllowedToken(address);
            if (isAllowed) allowedTokens.push({ name, address });
        }

        updateTokenDropdowns(allowedTokens);
        if (container) {
            allowedTokens.length === 0 
                ? container.innerHTML = '<p class="empty-state">No tokens whitelisted.</p>'
                : renderTokensList(allowedTokens);
        }
    } catch (error) {
        console.error('Token Load Error:', error);
    }
}

function updateTokenDropdowns(tokens) {
    ['tbTokenSelect', 'gbTokenSelect'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = '<option value="">Select a token...</option>' + 
                tokens.map(t => `<option value="${t.address}">${t.name}</option>`).join('');
        }
    });
}

/**
 * Storage Helpers
 */
function savePlanId(planId, type, tokenAddress) {
    const plans = JSON.parse(localStorage.getItem('salvaPlans') || '{}');
    if (!plans[userAddress]) plans[userAddress] = [];
    if (!plans[userAddress].find(p => p.id === planId)) {
        plans[userAddress].push({ id: planId, type, token: tokenAddress });
    }
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

async function getTokenDecimals(tokenAddress) {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, CONFIG.ERC20_ABI, provider);
        return await tokenContract.decimals();
    } catch (error) {
        return 18;
    }
}

async function manageToken(tokenAddress, tokenName, isAllowed) {
    try {
        showLoading('Processing...');
        const tx = await salvaContract.addOrRemoveToken(tokenAddress, tokenName, isAllowed);
        await tx.wait();
        await loadWhitelistedTokens();
        hideLoading();
        showNotification('Success!', 'success');
    } catch (error) {
        hideLoading();
        showNotification('Token management failed', 'error');
    }
}

// --- GLOBAL EXPORTS ---
window.loadUserPlansFromEvents = loadUserPlansFromEvents;
window.loadWhitelistedTokens = loadWhitelistedTokens;
window.createTimeBasedPlan = createTimeBasedPlan;
window.createGoalBasedPlan = createGoalBasedPlan;
window.fundTimeBasedPlan = fundTimeBasedPlan;
window.fundGoalBasedPlan = fundGoalBasedPlan;
window.withdrawFromTBS = withdrawFromTBS;
window.withdrawFromGBS = withdrawFromGBS;
window.getTokenDecimals = getTokenDecimals;
window.getPlanIds = getPlanIds;
window.manageToken = manageToken;