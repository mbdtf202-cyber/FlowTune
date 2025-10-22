import SecurityManager from "../contracts/SecurityManager.cdc"

/// Deploy and initialize the SecurityManager contract
/// This transaction should be run by the contract deployer
/// to set up the security infrastructure for FlowTune

transaction() {
    
    prepare(deployer: AuthAccount) {
        // Check if SecurityManager admin resource already exists
        if deployer.borrow<&SecurityManager.Admin>(from: SecurityManager.AdminStoragePath) == nil {
            // Create and save the admin resource
            let admin <- SecurityManager.createAdmin()
            deployer.save(<-admin, to: SecurityManager.AdminStoragePath)
            
            // Link the admin capability
            deployer.link<&SecurityManager.Admin{SecurityManager.AdminPublic}>(
                SecurityManager.AdminPublicPath,
                target: SecurityManager.AdminStoragePath
            )
            
            log("SecurityManager Admin resource created and saved")
        } else {
            log("SecurityManager Admin resource already exists")
        }
        
        // Create and save a rate limiter for general use
        if deployer.borrow<&SecurityManager.RateLimiter>(from: SecurityManager.RateLimiterStoragePath) == nil {
            let rateLimiter <- SecurityManager.createRateLimiter(cooldownPeriod: 60.0) // 1 minute cooldown
            deployer.save(<-rateLimiter, to: SecurityManager.RateLimiterStoragePath)
            
            log("RateLimiter resource created and saved")
        } else {
            log("RateLimiter resource already exists")
        }
    }
    
    execute {
        log("SecurityManager deployment transaction completed successfully")
        log("Contract is ready for secure operations")
    }
    
    post {
        // Verify the admin resource was created
        let adminRef = getAccount(0x01cf0e2f2f715450)
            .getCapability<&SecurityManager.Admin{SecurityManager.AdminPublic}>(SecurityManager.AdminPublicPath)
            .borrow()
        
        assert(adminRef != nil, message: "Failed to create SecurityManager Admin resource")
        log("Post-condition check passed: Admin resource is accessible")
    }
}