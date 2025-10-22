import FungibleToken from 0xee82856bf20e2aa6

/// SecurityManager - Security and Emergency Controls for FlowTune
/// 
/// This contract provides emergency pause functionality and multi-signature
/// controls for critical operations in the FlowTune ecosystem.
///
pub contract SecurityManager {

    /// Events
    pub event ContractInitialized()
    pub event EmergencyPaused(reason: String, pausedBy: Address)
    pub event EmergencyUnpaused(unpausedBy: Address)
    pub event AdminAdded(admin: Address, addedBy: Address)
    pub event AdminRemoved(admin: Address, removedBy: Address)
    pub event MultiSigTransactionProposed(id: String, proposer: Address)
    pub event MultiSigTransactionExecuted(id: String, executor: Address)

    /// Named Paths
    pub let AdminStoragePath: StoragePath
    pub let SecurityManagerStoragePath: StoragePath

    /// Contract state
    pub var isPaused: Bool
    pub var pauseReason: String
    access(self) var admins: {Address: Bool}
    access(self) var requiredSignatures: UInt8
    access(self) var pendingTransactions: {String: PendingTransaction}

    /// Pending transaction structure
    pub struct PendingTransaction {
        pub let id: String
        pub let action: String
        pub let proposer: Address
        pub let proposedAt: UFix64
        pub let signatures: {Address: Bool}
        pub let requiredSigs: UInt8

        init(id: String, action: String, proposer: Address, requiredSigs: UInt8) {
            self.id = id
            self.action = action
            self.proposer = proposer
            self.proposedAt = getCurrentBlock().timestamp
            self.signatures = {proposer: true}
            self.requiredSigs = requiredSigs
        }

        pub fun getSignatureCount(): UInt8 {
            var count: UInt8 = 0
            for signature in self.signatures.values {
                if signature {
                    count = count + 1
                }
            }
            return count
        }

        pub fun isReady(): Bool {
            return self.getSignatureCount() >= self.requiredSigs
        }
    }

    /// Admin resource for security operations
    pub resource Admin {
        /// Emergency pause the contract
        pub fun emergencyPause(reason: String) {
            pre {
                !SecurityManager.isPaused: "Contract is already paused"
                reason.length > 0: "Pause reason cannot be empty"
            }
            SecurityManager.isPaused = true
            SecurityManager.pauseReason = reason
            emit EmergencyPaused(reason: reason, pausedBy: self.owner!.address)
        }

        /// Unpause the contract
        pub fun emergencyUnpause() {
            pre {
                SecurityManager.isPaused: "Contract is not paused"
            }
            SecurityManager.isPaused = false
            SecurityManager.pauseReason = ""
            emit EmergencyUnpaused(unpausedBy: self.owner!.address)
        }

        /// Add a new admin (requires multi-sig)
        pub fun proposeAddAdmin(newAdmin: Address): String {
            let transactionId = "add_admin_".concat(newAdmin.toString()).concat("_").concat(getCurrentBlock().timestamp.toString())
            let transaction = PendingTransaction(
                id: transactionId,
                action: "add_admin:".concat(newAdmin.toString()),
                proposer: self.owner!.address,
                requiredSigs: SecurityManager.requiredSignatures
            )
            SecurityManager.pendingTransactions[transactionId] = transaction
            emit MultiSigTransactionProposed(id: transactionId, proposer: self.owner!.address)
            return transactionId
        }

        /// Sign a pending transaction
        pub fun signTransaction(transactionId: String) {
            pre {
                SecurityManager.pendingTransactions.containsKey(transactionId): "Transaction does not exist"
                SecurityManager.admins.containsKey(self.owner!.address): "Only admins can sign transactions"
            }
            
            let transaction = SecurityManager.pendingTransactions[transactionId]!
            if !transaction.signatures.containsKey(self.owner!.address) {
                transaction.signatures[self.owner!.address] = true
            }
        }

        /// Execute a multi-sig transaction
        pub fun executeTransaction(transactionId: String) {
            pre {
                SecurityManager.pendingTransactions.containsKey(transactionId): "Transaction does not exist"
            }
            
            let transaction = SecurityManager.pendingTransactions[transactionId]!
            assert(transaction.isReady(), message: "Transaction does not have enough signatures")
            
            // Parse and execute the action
            let actionParts = transaction.action.split(separator: ":")
            let action = actionParts[0]
            
            switch action {
                case "add_admin":
                    let adminAddress = Address.fromString(actionParts[1])!
                    SecurityManager.admins[adminAddress] = true
                    emit AdminAdded(admin: adminAddress, addedBy: self.owner!.address)
                case "remove_admin":
                    let adminAddress = Address.fromString(actionParts[1])!
                    SecurityManager.admins.remove(key: adminAddress)
                    emit AdminRemoved(admin: adminAddress, removedBy: self.owner!.address)
                default:
                    panic("Unknown action: ".concat(action))
            }
            
            // Remove the executed transaction
            SecurityManager.pendingTransactions.remove(key: transactionId)
            emit MultiSigTransactionExecuted(id: transactionId, executor: self.owner!.address)
        }

        /// Get pending transactions
        pub fun getPendingTransactions(): {String: PendingTransaction} {
            return SecurityManager.pendingTransactions
        }
    }

    /// Rate limiter resource
    pub resource RateLimiter {
        access(self) var lastAction: {Address: UFix64}
        pub let cooldownPeriod: UFix64

        init(cooldownPeriod: UFix64) {
            self.lastAction = {}
            self.cooldownPeriod = cooldownPeriod
        }

        pub fun checkRateLimit(user: Address): Bool {
            let now = getCurrentBlock().timestamp
            if let lastTime = self.lastAction[user] {
                if now < lastTime + self.cooldownPeriod {
                    return false
                }
            }
            self.lastAction[user] = now
            return true
        }

        pub fun getRemainingCooldown(user: Address): UFix64 {
            let now = getCurrentBlock().timestamp
            if let lastTime = self.lastAction[user] {
                let remaining = (lastTime + self.cooldownPeriod) - now
                return remaining > 0.0 ? remaining : 0.0
            }
            return 0.0
        }
    }

    /// Check if contract is paused
    pub fun getIsPaused(): Bool {
        return self.isPaused
    }

    /// Get pause reason
    pub fun getPauseReason(): String {
        return self.pauseReason
    }

    /// Check if address is admin
    pub fun isAdmin(address: Address): Bool {
        return self.admins.containsKey(address) && self.admins[address]!
    }

    /// Get all admins
    pub fun getAdmins(): [Address] {
        return self.admins.keys
    }

    /// Create admin resource
    pub fun createAdmin(): @Admin {
        return <- create Admin()
    }

    /// Create rate limiter
    pub fun createRateLimiter(cooldownPeriod: UFix64): @RateLimiter {
        return <- create RateLimiter(cooldownPeriod: cooldownPeriod)
    }

    /// Modifier function to check if contract is not paused
    pub fun requireNotPaused() {
        assert(!self.isPaused, message: "Contract is paused: ".concat(self.pauseReason))
    }

    /// Modifier function to check admin privileges
    pub fun requireAdmin(address: Address) {
        assert(self.isAdmin(address: address), message: "Admin privileges required")
    }

    /// Contract initialization
    init() {
        self.isPaused = false
        self.pauseReason = ""
        self.admins = {}
        self.requiredSignatures = 2
        self.pendingTransactions = {}

        self.AdminStoragePath = /storage/securityManagerAdmin
        self.SecurityManagerStoragePath = /storage/securityManager

        // Add contract deployer as initial admin
        self.admins[self.account.address] = true

        // Create and store admin resource
        let admin <- create Admin()
        self.account.save(<-admin, to: self.AdminStoragePath)

        emit ContractInitialized()
    }
}