import Marketplace from "../contracts/Marketplace.cdc"

/// Get Marketplace Listings - Retrieve all active listings from a storefront
/// 
/// This script returns all active listings with their details
///
pub fun main(address: Address): [{String: AnyStruct}] {
    let account = getAccount(address)
    let listings: [{String: AnyStruct}] = []
    
    if let storefront = account.getCapability<&Marketplace.Storefront{Marketplace.StorefrontPublic}>(Marketplace.StorefrontPublicPath).borrow() {
        let listingIDs = storefront.getListingIDs()
        
        for listingID in listingIDs {
            if let listing = storefront.borrowListing(listingID: listingID) {
                let details = listing.getDetails()
                listings.append({
                    "listingID": listingID,
                    "nftID": details.nftID,
                    "nftType": details.nftType.identifier,
                    "price": details.price,
                    "seller": details.seller,
                    "listedAt": details.listedAt
                })
            }
        }
    }
    
    return listings
}