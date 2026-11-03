import SwiftUI

@main
struct SevenRewardsApp: App {
    @StateObject private var store = RewardsStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
                .task { await store.load() }
        }
    }
}

struct RootView: View {
    @State private var tab = 0

    var body: some View {
        TabView(selection: $tab) {
            HomeView(selectedTab: $tab)
                .tabItem { Label("Home", systemImage: "house.fill") }.tag(0)
            DealsView()
                .tabItem { Label("Deals", systemImage: "tag.fill") }.tag(1)
            RewardsView()
                .tabItem { Label("7REWARDS", systemImage: "star.circle.fill") }.tag(2)
            ShopView()
                .tabItem { Label("Order", systemImage: "bag.fill") }.tag(3)
            AccountView()
                .tabItem { Label("Account", systemImage: "person.crop.circle") }.tag(4)
        }
        .tint(Brand.green)
        .environment(\.locale, Locale(identifier: "en_US"))
    }
}
