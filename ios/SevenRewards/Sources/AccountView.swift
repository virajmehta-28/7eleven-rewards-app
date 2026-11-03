import SwiftUI

struct AccountView: View {
    @EnvironmentObject var store: RewardsStore

    var body: some View {
        VStack(spacing: 0) {
            BrandHeader(title: "Account")
            List {
                Section {
                    HStack(spacing: 14) {
                        Text(String(store.member?.firstName.prefix(1) ?? "?") + String(store.member?.lastName.prefix(1) ?? ""))
                            .font(.title2.weight(.heavy)).foregroundStyle(.white)
                            .frame(width: 56, height: 56).background(Brand.green, in: Circle())
                        VStack(alignment: .leading) {
                            Text("\(store.member?.firstName ?? "") \(store.member?.lastName ?? "")").font(.headline)
                            Text("Member \(store.member?.id ?? "")").font(.caption.monospaced()).foregroundStyle(.secondary)
                        }
                    }
                }
                Section("7REWARDS") {
                    row("star.circle.fill", "Points balance", (store.member?.points ?? 0).formatted())
                    row("crown.fill", "Tier", store.member?.tier ?? "")
                    row("building.2.fill", "Home store", store.member?.homeStore ?? "")
                }
                Section("Settings") {
                    row("creditcard.fill", "Payment methods", "7-Eleven Wallet")
                    row("bell.badge.fill", "Notifications", "On")
                    row("questionmark.circle.fill", "Help & Support", "")
                }
                Section {
                    Text("7-Eleven for iOS · v8.42.0").font(.caption).foregroundStyle(.secondary)
                }
            }
        }
    }

    private func row(_ icon: String, _ title: String, _ value: String) -> some View {
        HStack {
            Image(systemName: icon).foregroundStyle(Brand.green).frame(width: 24)
            Text(title).layoutPriority(1)
            Spacer()
            Text(value).foregroundStyle(.secondary).font(.subheadline)
                .lineLimit(2).multilineTextAlignment(.trailing)
        }
    }
}
