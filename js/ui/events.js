// FILE: js/ui/events.js - FIXED VERSION

/**
 * Initialize all event handlers
 */
function initEventHandlers() {
    console.log('🎮 Initializing event handlers...');
    
    // Tab switching
    initTabSwitching();
    
    // Plan type toggle
    initPlanTypeToggle();
    
    // Form submissions
    initFormSubmissions();
    
    // Admin form
    initAdminForm();
}

/**
 * Initialize tab switching
 */
function initTabSwitching() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            if (tabName) {
                switchTab(tabName);
            }
        });
    });
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
    console.log('📑 Switching to tab:', tabName);
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to selected tab
    const targetContent = document.getElementById(`${tabName}Tab`);
    const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (targetContent) targetContent.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');
}

/**
 * Initialize plan type toggle (Time-Based vs Goal-Based)
 */
function initPlanTypeToggle() {
    const selectTimeBtn = document.getElementById('selectTimeBased');
    const selectGoalBtn = document.getElementById('selectGoalBased');
    const timeForm = document.getElementById('timeBasedForm');
    const goalForm = document.getElementById('goalBasedForm');
    
    if (selectTimeBtn && selectGoalBtn && timeForm && goalForm) {
        selectTimeBtn.addEventListener('click', () => {
            selectTimeBtn.classList.add('active');
            selectGoalBtn.classList.remove('active');
            timeForm.style.display = 'block';
            goalForm.style.display = 'none';
        });
        
        selectGoalBtn.addEventListener('click', () => {
            selectGoalBtn.classList.add('active');
            selectTimeBtn.classList.remove('active');
            goalForm.style.display = 'block';
            timeForm.style.display = 'none';
        });
    }
}

/**
 * Initialize form submissions
 */
function initFormSubmissions() {
    // Time-Based Form
    const timeForm = document.getElementById('timeBasedForm');
    if (timeForm) {
        timeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const token = document.getElementById('tbTokenSelect').value;
            const desc = document.getElementById('tbDescription').value;
            const dur = document.getElementById('tbDuration').value;
            
            if (!token) {
                showNotification('Please select a token', 'error');
                return;
            }
            
            if (!desc || !dur) {
                showNotification('Please fill all fields', 'error');
                return;
            }
            
            try {
                await createTimeBasedPlan(token, desc, parseInt(dur));
                timeForm.reset();
            } catch (error) {
                console.error('Time-based plan creation failed:', error);
            }
        });
    }
    
    // Goal-Based Form
    const goalForm = document.getElementById('goalBasedForm');
    if (goalForm) {
        goalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const token = document.getElementById('gbTokenSelect').value;
            const desc = document.getElementById('gbDescription').value;
            const target = document.getElementById('gbTargetAmount').value;
            
            if (!token) {
                showNotification('Please select a token', 'error');
                return;
            }
            
            if (!desc || !target) {
                showNotification('Please fill all fields', 'error');
                return;
            }
            
            try {
                const decimals = await getTokenDecimals(token);
                const targetWei = ethers.utils.parseUnits(target, decimals);
                await createGoalBasedPlan(token, desc, targetWei);
                goalForm.reset();
            } catch (error) {
                console.error('Goal-based plan creation failed:', error);
            }
        });
    }
}

/**
 * Initialize admin token management form
 */
function initAdminForm() {
    const adminForm = document.getElementById('tokenManageForm');
    
    if (adminForm) {
        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const tokenAddress = document.getElementById('adminTokenAddress').value;
            const tokenName = document.getElementById('adminTokenName').value;
            const isAllowed = document.getElementById('adminTokenAction').value === 'true';
            
            if (!tokenAddress || !tokenName) {
                showNotification('Please fill all fields', 'error');
                return;
            }
            
            // Validate address format
            if (!ethers.utils.isAddress(tokenAddress)) {
                showNotification('Invalid token address', 'error');
                return;
            }
            
            try {
                await manageToken(tokenAddress, tokenName, isAllowed);
                adminForm.reset();
            } catch (error) {
                console.error('Token management failed:', error);
            }
        });
    }
}

// Export functions
window.initEventHandlers = initEventHandlers;
window.switchTab = switchTab;