import SwiftUI

struct HomeView: View {
    @EnvironmentObject var store: RewardsStore
    @Binding var selectedTab: Int

    var body: some View {
        VStack(spacing: 0) {
            BrandHeader(title: "7-Eleven")
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    memberCard
                    if let err = store.loadError {
                        Label(err, systemImage: "wifi.exclamationmark")
                            .font(.footnote).foregroundStyle(Brand.red)
                    }
                    quickActions
                    sectionHeader("Today's Deals", action: { selectedTab = 1 })
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(SampleData.deals) { DealCard(deal: $0).frame(width: 280) }
                        }
                    }
                    sectionHeader("Redeem your points", action: { selectedTab = 2 })
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(store.rewards.prefix(5)) { r in
                                RewardTile(reward: r, points: store.member?.points ?? 0)
                                    .frame(width: 150)
                                    .onTapGesture { selectedTab = 2 }
                            }
                        }
                    }
                }
                .padding()
            }
            .background(Brand.background)
            .refreshable { await store.load() }
        }
    }

    private var memberCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Hi, \(store.member?.firstName ?? "there")!").font(.title2.weight(.heavy))
                    Text("7REWARDS \(store.member?.tier ?? "") Member").font(.subheadline).opacity(0.9)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 0) {
                    Text((store.member?.points ?? 0).formatted())
                        .font(.system(size: 34, weight: .black, design: .rounded))
                    Text("points").font(.caption.weight(.semibold))
                }
            }
            .foregroundStyle(.white)
            VStack(spacing: 6) {
                Barcode(seed: store.member?.id ?? "7R-00000000").frame(height: 54)
                Text(store.member?.id ?? "—").font(.caption.monospaced()).foregroundStyle(.secondary)
            }
            .padding(12)
            .background(.white, in: RoundedRectangle(cornerRadius: 12))
            Text("Scan at checkout to earn points on every purchase")
                .font(.caption).foregroundStyle(.white.opacity(0.9))
        }
        .padding()
        .background(
            LinearGradient(colors: [Brand.green, Brand.darkGreen], startPoint: .topLeading, endPoint: .bottomTrailing),
            in: RoundedRectangle(cornerRadius: 18)
        )
    }

    private var quickActions: some View {
        HStack {
            quick("Scan & Pay", "qrcode.viewfinder", Brand.green) {}
            quick("7NOW Delivery", "bicycle", Brand.orange) { selectedTab = 3 }
            quick("Fuel", "fuelpump.fill", Brand.red) {}
            quick("Stores", "mappin.and.ellipse", Brand.darkGreen) {}
        }
    }

    private func quick(_ title: String, _ icon: String, _ color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: icon).font(.title2).foregroundStyle(color)
                    .frame(width: 54, height: 54)
                    .background(.white, in: Circle())
                    .shadow(color: .black.opacity(0.08), radius: 4, y: 2)
                Text(title).font(.caption2.weight(.semibold)).foregroundStyle(.primary)
                    .lineLimit(1).minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity)
        }
    }

    private func sectionHeader(_ title: String, action: @escaping () -> Void) -> some View {
        HStack {
            Text(title).font(.headline.weight(.heavy))
            Spacer()
            Button("See all", action: action).font(.subheadline.weight(.semibold)).foregroundStyle(Brand.green)
        }
    }
}

struct DealCard: View {
    let deal: Deal

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: deal.icon).font(.title).foregroundStyle(.white)
                .frame(width: 56, height: 56)
                .background(Brand.orange, in: RoundedRectangle(cornerRadius: 12))
            VStack(alignment: .leading, spacing: 4) {
                Text(deal.badge).font(.caption2.weight(.heavy)).foregroundStyle(Brand.red)
                Text(deal.title).font(.subheadline.weight(.bold)).lineLimit(2)
                Text(deal.subtitle).font(.caption).foregroundStyle(.secondary).lineLimit(2)
            }
            Spacer(minLength: 0)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.white, in: RoundedRectangle(cornerRadius: 14))
    }
}

struct RewardTile: View {
    let reward: Reward
    let points: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: reward.image).font(.system(size: 30)).foregroundStyle(Brand.green)
                .frame(maxWidth: .infinity, minHeight: 70)
                .background(Brand.green.opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
            Text(reward.name).font(.subheadline.weight(.bold)).lineLimit(2, reservesSpace: true)
            HStack {
                PointsPill(points: reward.pointsCost)
                Spacer()
                if points >= reward.pointsCost {
                    Image(systemName: "checkmark.seal.fill").foregroundStyle(Brand.green)
                }
            }
        }
        .padding(10)
        .background(.white, in: RoundedRectangle(cornerRadius: 14))
    }
}
