import Foundation

struct Member: Codable {
    let id: String
    let firstName: String
    let lastName: String
    let tier: String
    var points: Int
    let homeStore: String
}

struct Reward: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
    let category: String
    let pointsCost: Int
    let image: String
}

struct Redemption: Codable, Identifiable {
    var id: String { confirmationCode }
    let confirmationCode: String
    let rewardId: Int
    let rewardName: String
    let pointsSpent: Int
    let remainingPoints: Int
    let expiresAt: String
}

struct APIErrorBody: Codable {
    let error: String
    let message: String?
    let incidentId: String?
}

struct CartLine: Codable, Hashable {
    let sku: String
    let quantity: Int
}

struct CheckoutRequest: Encodable {
    let cart: [CartLine]
    var previewToken: String?
}

struct CheckoutItem: Codable, Hashable {
    let sku: String
    let name: String
    let quantity: Int
    let unitPrice: Double
    let lineTotal: Double
}

struct AppliedReward: Codable, Hashable {
    let rewardId: Int
    let name: String
    let sku: String
    let itemName: String
    let pointsSpent: Int
    let savings: Double
    var confirmationCode: String?
    var expiresAt: String?
    var remainingPoints: Int?
}

struct UnappliedReward: Codable, Hashable {
    let rewardId: Int
    let name: String
    let sku: String
    let pointsCost: Int
    let pointsNeeded: Int
}

struct CheckoutPreview: Codable {
    let previewToken: String
    let expiresAt: String
    let items: [CheckoutItem]
    let subtotal: Double
    let appliedRewards: [AppliedReward]
    let unappliedRewards: [UnappliedReward]
    let rewardSavings: Double
    let totalPointsCost: Int
    let total: Double
    let pointsBalance: Int
    let remainingPoints: Int
}

struct CheckoutConfirmation: Codable {
    let orderId: String
    let status: String
    let items: [CheckoutItem]
    let subtotal: Double
    let appliedRewards: [AppliedReward]
    let rewardSavings: Double
    let totalPointsCost: Int
    let total: Double
    let pointsBalance: Int
    let remainingPoints: Int
    let confirmedAt: String
    var replayed: Bool?
}

struct Deal: Identifiable {
    let id = UUID()
    let title: String
    let subtitle: String
    let badge: String
    let icon: String
}

struct Product: Identifiable, Hashable {
    let id = UUID()
    let sku: String
    let name: String
    let price: Double
    let icon: String
    let category: String
}

enum SampleData {
    static let deals: [Deal] = [
        Deal(title: "$1 Any Size Coffee", subtitle: "Mon–Fri, 5–10 AM. 7REWARDS members only.", badge: "MEMBER DEAL", icon: "cup.and.saucer.fill"),
        Deal(title: "2 for $5 Big Bite", subtitle: "Mix & match hot dogs, taquitos and more.", badge: "HOT FOODS", icon: "flame.fill"),
        Deal(title: "Double Points on Slurpee", subtitle: "Earn 2x points on any size Slurpee this week.", badge: "2X POINTS", icon: "snowflake"),
        Deal(title: "$2 off Large Pizza", subtitle: "Order ahead for pickup or delivery.", badge: "7NOW", icon: "circle.grid.cross.fill"),
        Deal(title: "Save 10¢/gal", subtitle: "Pay with 7REWARDS at participating pumps.", badge: "FUEL", icon: "fuelpump.fill")
    ]

    static let products: [Product] = [
        Product(sku: "COF-7S-HOT-20", name: "7-Select Hot Coffee 20oz", price: 1.99, icon: "cup.and.saucer.fill", category: "Drinks"),
        Product(sku: "SLP-COKE-M", name: "Slurpee Coke Medium", price: 2.29, icon: "snowflake", category: "Drinks"),
        Product(sku: "BGP-FTN-30", name: "Big Gulp 30oz", price: 1.79, icon: "takeoutbag.and.cup.and.straw.fill", category: "Drinks"),
        Product(sku: "RBL-ENR-12", name: "Red Bull 12oz", price: 3.99, icon: "bolt.fill", category: "Drinks"),
        Product(sku: "BBT-QTR-LB", name: "Big Bite Quarter Pound", price: 3.49, icon: "flame.fill", category: "Hot Foods"),
        Product(sku: "PZA-PEP-LG", name: "Large Pepperoni Pizza", price: 9.99, icon: "circle.grid.cross.fill", category: "Hot Foods"),
        Product(sku: "TAQ-CHK-2", name: "Chicken Taquitos (2)", price: 2.99, icon: "flame", category: "Hot Foods"),
        Product(sku: "CHP-DOR-NCH", name: "Doritos Nacho Cheese", price: 2.49, icon: "bag.fill", category: "Snacks"),
        Product(sku: "BKY-7S-GLZ", name: "7-Select Glazed Donut", price: 1.39, icon: "circle.dashed", category: "Snacks"),
        Product(sku: "SNK-7S-TRL", name: "7-Select Trail Mix", price: 4.29, icon: "leaf.fill", category: "Snacks"),
        Product(sku: "OTC-ADV-24", name: "Advil 24ct", price: 7.49, icon: "cross.case.fill", category: "Essentials"),
        Product(sku: "ACC-USBC-CHG", name: "Phone Charger USB-C", price: 14.99, icon: "cable.connector", category: "Essentials")
    ]
}
