# SALVA V1 🔒

**Decentralized Non-Custodial Savings Protocol**

SALVA is a smart contract-based savings platform that helps you commit to your financial goals through time-locked or goal-based savings plans. Built on Ethereum, SALVA gives you full control of your funds while providing the discipline of commitment-based savings.

---

## 🌟 Features

### 💎 Core Functionality
- **Time-Based Savings**: Lock your tokens until a specific date
- **Goal-Based Savings**: Save towards a target amount
- **Non-Custodial**: You maintain full control of your funds
- **Multi-Token Support**: Works with any ERC20 token (USDT, USDC, DAI, etc.)
- **Flexible Decimals**: Automatically handles tokens with different decimal places (6, 8, 18, etc.)

### 🔐 Security
- **Audited Contract Pattern**: Uses OpenZeppelin's SafeERC20
- **Owner-Controlled Whitelist**: Only approved tokens can be used
- **No Backdoors**: Funds can only be withdrawn by the plan creator
- **Immutable Owner**: Contract ownership cannot be transferred

### 🎨 User Experience
- **Clean Modern UI**: Beautiful dark-themed interface
- **Real-time Balance Tracking**: See your progress across all plans
- **Responsive Design**: Works on desktop, tablet, and mobile
- **MetaMask Integration**: Seamless wallet connection

---

## 🚀 Quick Start

### Prerequisites
- MetaMask or any Web3 wallet
- Some ETH on Sepolia Testnet for gas fees
- Whitelisted ERC20 tokens

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/cboi019/salva-frontend.git
cd salva-frontend
```

2. **Open the application**
Simply open `index.html` in your browser or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using VS Code Live Server extension
# Right-click on index.html -> Open with Live Server
```

3. **Connect your wallet**
- Click "Connect Wallet" in the top right
- Approve the connection in MetaMask
- Switch to Sepolia Testnet if prompted

---

## 📖 How It Works

### Creating a Savings Plan

#### Time-Based Plan
1. Navigate to "Create Commitment" tab
2. Select "Time-Based Plan"
3. Enter:
   - Token contract address (must be whitelisted)
   - Description (e.g., "Emergency Fund")
   - Lock duration in days
4. Click "Create Time-Based Plan"
5. Confirm the transaction in MetaMask

#### Goal-Based Plan
1. Navigate to "Create Commitment" tab
2. Select "Goal-Based Plan"
3. Enter:
   - Token contract address (must be whitelisted)
   - Description (e.g., "House Down Payment")
   - Target amount
4. Click "Create Goal-Based Plan"
5. Confirm the transaction in MetaMask

### Funding Your Plan

1. Go to "View Commitments" tab
2. Find your plan
3. Click "Fund Plan"
4. Enter the amount to deposit
5. Approve token spending (first time only)
6. Confirm the funding transaction

### Withdrawing Funds

**Time-Based Plans**: Can withdraw after the maturity date
**Goal-Based Plans**: Can withdraw after reaching the target amount

1. Go to "View Commitments" tab
2. Find your matured/completed plan
3. Click "Withdraw"
4. Enter amount to withdraw (or withdraw all)
5. Confirm the transaction

---

## 🏗️ Project Structure

```
salva-frontend/
├── index.html              # Homepage
├── app.html               # Dashboard
├── css/
│   ├── main.css          # Main styles & layout
│   └── components.css    # UI components styles
├── js/
│   ├── config.js         # Contract addresses & ABIs
│   ├── wallet.js         # Wallet connection logic
│   ├── app.js           # Main app initialization
│   ├── contracts/
│   │   ├── erc20.js     # ERC20 token interactions
│   │   └── salva.js     # SALVA contract interactions
│   └── ui/
│       ├── render.js    # UI rendering functions
│       └── events.js    # Event handlers
└── README.md
```

---

## 🔧 Configuration

### Contract Addresses (Sepolia Testnet)

Located in `js/config.js`:

```javascript
SALVA_ADDRESS: '0x9FfC17C059912f45BD920610952f504fe84a63d4'
OWNER_ADDRESS: '0x708657da3e4effa7334779c9a1e759dc38a5bf94'
CHAIN_ID: 11155111 // Sepolia
```

### Supported Networks
Currently deployed on:
- ✅ Sepolia Testnet
- 🔜 Ethereum Mainnet (Coming in V2)

---

## 💡 Use Cases

### Personal Finance
- 🏖️ **Vacation Savings**: Lock funds for 6 months for your dream trip
- 🚨 **Emergency Fund**: Build discipline by setting a 1-year time lock
- 🎓 **Education Fund**: Save towards tuition with goal-based commitment

### DeFi Strategies
- 📈 **Diamond Hands**: Lock tokens during market volatility
- 💰 **Dollar-Cost Averaging**: Regular deposits towards a savings goal
- 🎯 **Target-Based Exits**: Set profit-taking goals in advance

### Business
- 💼 **Operational Reserve**: Lock business funds for stability
- 🎁 **Employee Bonuses**: Time-locked token bonuses
- 📊 **Budget Planning**: Goal-based departmental savings

---

## 🎮 User Guide

### Dashboard Overview

**Total Balance Card**
- Shows combined value of all your active plans
- Supports multiple tokens
- Updates automatically after transactions

**Create Commitment Tab**
- Switch between Time-Based and Goal-Based plans
- Input validation for all fields
- Real-time token verification

**View Commitments Tab**
- Visual progress tracking
- Countdown timers for time-based plans
- Progress bars for goal-based plans
- Quick access to fund/withdraw actions

**Allowed Tokens Tab**
- View all whitelisted tokens
- See token addresses and names
- Available to all users

**Manage Tokens Tab** (Owner Only)
- Add new tokens to whitelist
- Remove tokens from whitelist
- Admin-only access control

---

## 🛡️ Security Best Practices

### For Users
1. **Verify Contract Address**: Always check you're interacting with the official SALVA contract
2. **Check Token Approvals**: Review unlimited approvals periodically
3. **Test with Small Amounts**: Start with small deposits to test functionality
4. **Keep Recovery Phrase Safe**: Your wallet = your funds
5. **Verify Transactions**: Always review transaction details in MetaMask

### For Developers
1. **Use Latest Dependencies**: Keep ethers.js and libraries updated
2. **Environment Variables**: Never commit private keys or sensitive data
3. **Gas Optimization**: Test transactions on testnet first
4. **Error Handling**: Implement comprehensive error catching
5. **Audit Smart Contracts**: Have contracts audited before mainnet deployment

---

## 🧪 Testing

### Testing on Sepolia

1. **Get Sepolia ETH**
   - [Sepolia Faucet](https://sepoliafaucet.com/)
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)

2. **Get Test Tokens**
   - Request whitelist from contract owner
   - Or deploy your own ERC20 test token

3. **Test Workflow**
   ```
   1. Connect wallet
   2. Create a time-based plan (1 day lock)
   3. Fund the plan with test tokens
   4. Wait 24 hours
   5. Withdraw funds
   ```

---

## 📊 Smart Contract Details

### Key Functions

**User Functions:**
- `createTimeBasedPlan(address _token, string _description, uint256 _savingsDuration)`
- `createGoalBasedPlan(address _token, string _description, uint256 _targetAmount)`
- `fundTimeBasedPlan(address _token, uint256 _id, uint256 _amount)`
- `fundGoalBasedPlan(address _token, uint256 _id, uint256 _amount)`
- `withdrawFromTBS(uint256 _id, uint256 _amount)`
- `withdrawFromGBS(uint256 _id, uint256 _amount)`

**View Functions:**
- `viewTimeBasedPlan(address _user, uint256 _id)`
- `viewGoalBasedPlan(address _user, uint256 _id)`
- `checkAllowedToken(address _tokenAddress)`
- `getOwner()`

**Owner Functions:**
- `addOrRemoveToken(address _tokenAddress, string _name, bool _isAllowed)`

### Events
```solidity
event planCreated(address indexed _user, string _description, uint256 _planID)
event planFunded(address indexed _user, string _description, uint256 _amount, uint256 _id)
event planEnded(address indexed _user, string _description, uint256 _id)
event GoalAchieved(address indexed _user, uint256 _amount)
event tokenAdded(address indexed _tokenAddress, string _name, bool _isAllowed)
event tokenRemoved(address indexed _tokenAddress, string _name, bool _isAllowed)
```

---

## 🐛 Known Issues & Limitations

### Current Limitations
- **Testnet Only**: Currently deployed on Sepolia (mainnet coming in V2)
- **No Interest Earning**: V1 doesn't generate yield (AAVE integration in V2)
- **Token Whitelist Required**: Only whitelisted tokens can be used
- **No Partial Maturity**: Time-based plans unlock at exact maturity time
- **Browser Storage for Plan IDs**: Plans stored in localStorage (use same browser)

### Planned Features (V2)
- 🏦 AAVE integration for yield generation
- 🔄 Multi-chain support (Polygon, Arbitrum, Optimism)
- 📱 Mobile app (iOS/Android)
- 🤝 Shared savings goals
- 📈 Analytics dashboard
- 🔔 Email/push notifications
- 💱 Auto-swap functionality
- 🎁 Referral rewards

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report Bugs**
   - Open an issue describing the bug
   - Include steps to reproduce
   - Provide browser/wallet details

2. **Suggest Features**
   - Open an issue with [FEATURE] tag
   - Explain the use case
   - Describe expected behavior

3. **Submit Pull Requests**
   ```bash
   # Fork the repository
   # Create a feature branch
   git checkout -b feature/amazing-feature
   
   # Make your changes
   git commit -m "Add amazing feature"
   
   # Push to your fork
   git push origin feature/amazing-feature
   
   # Open a Pull Request
   ```

### Development Guidelines
- Follow existing code style
- Add comments for complex logic
- Test on Sepolia before submitting
- Update README if needed

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Charlie Onyii**

- 📧 Email: [charlieonyii42@gmail.com](mailto:charlieonyii42@gmail.com)
- 🐦 Twitter: [@cboi019](https://x.com/cboi019)
- 💻 GitHub: [@cboi019](https://github.com/cboi019)

---

## 🙏 Acknowledgments

- **OpenZeppelin**: For secure smart contract libraries
- **Ethers.js**: For Web3 interactions
- **MetaMask**: For wallet integration
- **Sepolia**: For reliable testnet infrastructure
- **The Ethereum Community**: For inspiration and support

---

### FAQ

**Q: Why can't I withdraw from my time-based plan?**
A: The maturity date hasn't been reached yet. Check "Days Left" on your plan card.

**Q: Why is my transaction failing?**
A: Common causes:
- Insufficient gas fees
- Token not approved
- Token not whitelisted
- Invalid amount (check decimals)

**Q: Can I cancel a plan before maturity?**
A: No, this is the core feature - commitment savings. Choose your lock period carefully.

**Q: What happens if I lose access to my wallet?**
A: SALVA is non-custodial. If you lose your wallet, you lose access to your funds. Always backup your recovery phrase.

**Q: Are my funds safe?**
A: Your funds are locked in a smart contract. Only you can withdraw them after maturity.

**Q: Can I have multiple plans?**
A: Yes! Create as many plans as you want with different tokens, durations, and goals.

---

## 🔐 Security Audits

### Audit Status
- ⏳ **Internal Review**: Completed
- ⏳ **External Audit**: Scheduled for Q2 2025
- ⏳ **Bug Bounty**: Coming soon

### Responsible Disclosure
Found a vulnerability? Please report it privately to [charlieonyii42@gmail.com](mailto:charlieonyii42@gmail.com)

---

## 📈 Statistics

- **Total Value Locked**: Coming Soon
- **Active Plans**: Coming Soon
- **Unique Users**: Coming Soon
- **Transactions**: Coming Soon

---

## 🌐 Links

- **Website**: Coming Soon
- **Documentation**: This README
- **Contract**: [0x9FfC17C059912f45BD920610952f504fe84a63d4](https://sepolia.etherscan.io/address/0x9FfC17C059912f45BD920610952f504fe84a63d4)
- **GitHub**: [github.com/cboi019/SALVA-V1-Frontend](https://github.com/cboi019/SALVA-V1-Frontend)

---

## 💬 Community

Join the SALVA community:

- 🐦 Follow on Twitter: [@cboi019](https://x.com/cboi019)
- 💻 Star on GitHub: [SALVA Repository](https://github.com/cboi019/salva-frontend)
- 📧 Newsletter: Coming Soon
- 💬 Discord: Coming Soon

---

## ⚠️ IMPORTANT DISCLAIMER

**🚨 NOT AUDITED - TESTNET ONLY 🚨**

This smart contract has **NOT** been professionally audited. Do **NOT** use this contract with real funds on mainnet.

**ONLY use SALVA with:**
- ✅ Sepolia testnet tokens
- ✅ Test funds with no real value
- ✅ Educational and testing purposes

**DO NOT use SALVA with:**
- ❌ Real mainnet tokens
- ❌ Actual funds or valuable assets
- ❌ Production environments

The developers are not responsible for any loss of funds. This is experimental software provided "as-is" without any warranties. Always understand the risks before interacting with any smart contract.

---

<div align="center">

**Built with ❤️ for the Ethereum Community**

*Commit to Your Future, One Block at a Time*

[⬆ Back to Top](#salva-v1-)

</div>