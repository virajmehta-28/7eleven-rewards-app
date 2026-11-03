import SwiftUI

struct RewardsView: View {
    @EnvironmentObject var store: RewardsStore
    @State private var selected: Reward?
    @State private var category = "All"

    private var categories: [String] { ["All"] + Array(Set(store.rewards.map(\.category))).sorted() }
    private var filtered: [Reward] { category == "All" ? store.rewards : store.rewards.filter { $0.category == category } }

    var body: some View {
        VStack(spacing: 0) {
            BrandHeader(title: "7REWARDS")
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    balance
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack {
                            ForEach(categories, id: \.self) { c in
                                Button(c) { category = c }
                                    .font(.subheadline.weight(.semibold))
                                    .padding(.horizontal, 14).padding(.vertical, 7)
                                    .background(category == c ? Brand.green : .white, in: Capsule())
                                    .foregroundStyle(category == c ? .white : .primary)
                            }
                        }
                    }
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                        ForEach(filtered) { r in
                            RewardTile(reward: r, points: store.member?.points ?? 0)
                                .onTapGesture { selected = r }
                                .accessibilityIdentifier("reward-\(r.id)")
                        }
                    }
                    if !store.redemptions.isEmpty {
                        Text("Your redeemed rewards").font(.headline.weight(.heavy))
                        ForEach(store.redemptions) { r in
                            HStack {
                                Image(systemName: "ticket.fill").foregroundStyle(Brand.orange)
                                VStack(alignment: .leading) {
                                    Text(r.rewardName).font(.subheadline.weight(.bold))
                                    Text("Code \(r.confirmationCode)").font(.caption.monospaced()).foregroundStyle(.secondary)
                                }
                                Spacer()
                                Text("-\(r.pointsSpent)").font(.subheadline.weight(.bold)).foregroundStyle(Brand.red)
                            }
                            .padding(12).background(.white, in: RoundedRectangle(cornerRadius: 12))
                        }
                    }
                }
                .padding()
            }
            .background(Brand.background)
        }
        .sheet(item: $selected) { RedeemSheet(reward: $0).presentationDetents([.medium, .large]).presentationBackground(Brand.background).presentationDragIndicator(.visible) }
    }

    private var balance: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("Available points").font(.subheadline).foregroundStyle(.secondary)
                Text((store.member?.points ?? 0).formatted())
                    .font(.system(size: 40, weight: .black, design: .rounded)).foregroundStyle(Brand.green)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                Text(store.member?.tier.uppercased() ?? "").font(.caption.weight(.heavy))
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(Brand.orange.opacity(0.15), in: Capsule()).foregroundStyle(Brand.orange)
                Text("Points expire 12/31").font(.caption2).foregroundStyle(.secondary)
            }
        }
        .padding().background(.white, in: RoundedRectangle(cornerRadius: 16))
    }
}

struct RedeemSheet: View {
    @EnvironmentObject var store: RewardsStore
    @Environment(\.dismiss) private var dismiss
    let reward: Reward
    @State private var isRedeeming = false
    @State private var result: Redemption?
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 18) {
            Image(systemName: reward.image).font(.system(size: 54)).foregroundStyle(Brand.green)
                .frame(width: 110, height: 110).background(Brand.green.opacity(0.1), in: Circle())
                .padding(.top, 24)
            Text(reward.name).font(.title2.weight(.heavy)).multilineTextAlignment(.center)
            PointsPill(points: reward.pointsCost)

            if let result {
                VStack(spacing: 8) {
                    Label("Reward redeemed!", systemImage: "checkmark.circle.fill").font(.headline).foregroundStyle(Brand.green)
                    Barcode(seed: result.confirmationCode).frame(height: 50)
                    Text("Show code \(result.confirmationCode) at checkout").font(.caption)
                }
                .padding().background(.white, in: RoundedRectangle(cornerRadius: 12))
                Button("Done") { dismiss() }.buttonStyle(SevenButtonStyle())
            } else {
                Text("Redeem \(reward.pointsCost) points for this reward. Your offer will be added to your account and is valid for 7 days at participating stores.")
                    .font(.footnote).foregroundStyle(.secondary).multilineTextAlignment(.center)
                Button {
                    Task { await redeem() }
                } label: {
                    if isRedeeming { ProgressView().tint(.white) } else { Text("Redeem Reward") }
                }
                .buttonStyle(SevenButtonStyle())
                .disabled(isRedeeming)
                .accessibilityIdentifier("redeem-button")
            }
            Spacer()
        }
        .padding()
        .alert("Unable to Redeem", isPresented: Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage ?? "")
        }
    }

    private func redeem() async {
        isRedeeming = true
        defer { isRedeeming = false }
        do {
            result = try await store.redeem(reward)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct SevenButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline.weight(.bold))
            .frame(maxWidth: .infinity, minHeight: 52)
            .background(Brand.green.opacity(configuration.isPressed ? 0.8 : 1), in: RoundedRectangle(cornerRadius: 26))
            .foregroundStyle(.white)
    }
}
