import SwiftUI

struct CheckoutView: View {
    @EnvironmentObject var store: RewardsStore
    @Environment(\.dismiss) private var dismiss
    @State private var preview: CheckoutPreview?
    @State private var previewLines: [CartLine] = []
    @State private var isPreviewing = false
    @State private var previewError: String?
    @State private var isPlacing = false
    @State private var notice: String?
    @State private var errorMessage: String?
    @State private var confirmation: CheckoutConfirmation?
    @State private var refreshCount = 0

    private struct PreviewTrigger: Equatable {
        let lines: [CartLine]
        let refresh: Int
    }

    private var isReady: Bool {
        preview != nil && !isPreviewing && previewLines == store.cartLines && !store.cartLines.isEmpty
    }

    var body: some View {
        NavigationStack {
            Group {
                if let confirmation {
                    OrderConfirmationView(confirmation: confirmation) { dismiss() }
                } else if store.cartCount == 0 {
                    emptyCart
                } else {
                    checkout
                }
            }
            .background(Brand.background)
            .navigationTitle(confirmation == nil ? "Checkout" : "Order Placed")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if confirmation == nil {
                    ToolbarItem(placement: .cancellationAction) { Button("Close") { dismiss() } }
                }
            }
        }
        .task(id: PreviewTrigger(lines: store.cartLines, refresh: refreshCount)) { await refreshPreview() }
        .alert("Unable to Place Order", isPresented: Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage ?? "")
        }
    }

    // MARK: - Sections

    private var checkout: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    if let notice {
                        Label(notice, systemImage: "arrow.triangle.2.circlepath")
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(Brand.orange)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(12)
                            .background(Brand.orange.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
                            .accessibilityIdentifier("checkout-notice")
                    }
                    if let preview, preview.rewardSavings > 0 {
                        savingsBanner(preview)
                    }
                    orderCard
                    rewardsCard
                    if let previewError {
                        HStack {
                            Label(previewError, systemImage: "wifi.exclamationmark").font(.footnote).foregroundStyle(Brand.red)
                            Spacer()
                            Button("Retry") { refreshCount += 1 }.font(.footnote.weight(.bold))
                        }
                    }
                    if let preview { summaryCard(preview) }
                }
                .padding()
            }
            placeOrderButton
        }
    }

    private func savingsBanner(_ p: CheckoutPreview) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "star.circle.fill").font(.system(size: 34)).foregroundStyle(.white)
            VStack(alignment: .leading, spacing: 2) {
                (Text("You saved ") + Text(p.rewardSavings, format: .currency(code: "USD")) + Text(" with 7REWARDS"))
                    .font(.headline.weight(.heavy))
                Text("Using \(p.totalPointsCost.formatted()) pts · \(p.remainingPoints.formatted()) pts left")
                    .font(.caption.weight(.semibold)).opacity(0.9)
            }
            Spacer(minLength: 0)
        }
        .foregroundStyle(.white)
        .padding()
        .background(Brand.green, in: RoundedRectangle(cornerRadius: 16))
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("checkout-savings")
    }

    private var orderCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Your order").font(.headline.weight(.heavy))
            ForEach(store.cartProducts) { p in
                let qty = store.cart[p] ?? 0
                let applied = appliedRewards(for: p.sku)
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 12) {
                        Image(systemName: p.icon).font(.title3).foregroundStyle(Brand.orange)
                            .frame(width: 44, height: 44).background(Brand.orange.opacity(0.1), in: RoundedRectangle(cornerRadius: 10))
                        VStack(alignment: .leading, spacing: 2) {
                            Text(p.name).font(.subheadline.weight(.bold)).lineLimit(2)
                            Text(p.price * Double(qty), format: .currency(code: "USD")).font(.subheadline).foregroundStyle(.secondary)
                        }
                        Spacer(minLength: 8)
                        quantityStepper(p, qty: qty)
                    }
                    if !applied.isEmpty {
                        let savings = applied.reduce(0) { $0 + $1.savings }
                        let points = applied.reduce(0) { $0 + $1.pointsSpent }
                        HStack(spacing: 6) {
                            Image(systemName: "star.fill").font(.caption2)
                            Text("\(applied.count > 1 ? "\(applied.count)× " : "")\(applied[0].name) · \(points.formatted()) pts")
                                .font(.caption.weight(.bold)).lineLimit(1)
                            Spacer()
                            Text(-savings, format: .currency(code: "USD")).font(.caption.weight(.heavy))
                        }
                        .foregroundStyle(Brand.green)
                        .padding(.horizontal, 10).padding(.vertical, 6)
                        .background(Brand.green.opacity(0.1), in: Capsule())
                    }
                }
            }
        }
        .padding()
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
    }

    private func quantityStepper(_ p: Product, qty: Int) -> some View {
        HStack(spacing: 10) {
            Button { store.remove(p) } label: {
                Image(systemName: qty > 1 ? "minus" : "trash").font(.caption.weight(.bold))
                    .frame(width: 30, height: 30).background(Brand.background, in: Circle())
            }
            .accessibilityLabel(qty > 1 ? "Remove one \(p.name)" : "Remove \(p.name)")
            Text("\(qty)").font(.subheadline.weight(.bold)).monospacedDigit().frame(minWidth: 18)
            Button { store.add(p) } label: {
                Image(systemName: "plus").font(.caption.weight(.bold)).foregroundStyle(.white)
                    .frame(width: 30, height: 30).background(Brand.green, in: Circle())
            }
            .accessibilityLabel("Add one \(p.name)")
        }
        .buttonStyle(.plain)
        .foregroundStyle(.primary)
    }

    private var rewardsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("7REWARDS applied").font(.headline.weight(.heavy))
                Spacer()
                if isPreviewing { ProgressView().controlSize(.small) }
                if let points = preview?.pointsBalance ?? store.member?.points { PointsPill(points: points) }
            }
            if let preview {
                if preview.appliedRewards.isEmpty {
                    Text("No rewards apply to this order yet.").font(.subheadline).foregroundStyle(.secondary)
                }
                ForEach(Array(preview.appliedRewards.enumerated()), id: \.offset) { _, r in
                    HStack(spacing: 10) {
                        Image(systemName: "ticket.fill").foregroundStyle(Brand.orange)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(r.name).font(.subheadline.weight(.bold))
                            Text("On \(r.itemName) · \(r.pointsSpent.formatted()) pts").font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(-r.savings, format: .currency(code: "USD")).font(.subheadline.weight(.bold)).foregroundStyle(Brand.green)
                    }
                }
                ForEach(uniqueUnapplied(preview), id: \.rewardId) { u in
                    Label(u.pointsNeeded > 0
                          ? "Earn \(u.pointsNeeded.formatted()) more pts to use \(u.name)"
                          : "\(u.name) not applied — your points went further on other items",
                          systemImage: "info.circle")
                        .font(.caption).foregroundStyle(.secondary)
                }
            } else if previewError == nil {
                Text("Finding your best rewards…").font(.subheadline).foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .accessibilityIdentifier("checkout-rewards")
    }

    private func summaryCard(_ p: CheckoutPreview) -> some View {
        VStack(spacing: 8) {
            summaryRow("Subtotal", Text(p.subtotal, format: .currency(code: "USD")))
            if p.rewardSavings > 0 {
                summaryRow("7REWARDS savings", Text(-p.rewardSavings, format: .currency(code: "USD")).foregroundStyle(Brand.green))
            }
            Divider()
            summaryRow("Total", Text(p.total, format: .currency(code: "USD")).font(.title3.weight(.heavy)), bold: true)
            if p.totalPointsCost > 0 {
                summaryRow("Points used", Text("\(p.totalPointsCost.formatted()) pts"))
                summaryRow("Points after order", Text("\(p.remainingPoints.formatted()) pts"))
            }
        }
        .padding()
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
    }

    private func summaryRow(_ label: String, _ value: Text, bold: Bool = false) -> some View {
        HStack {
            Text(label).font(bold ? .headline.weight(.heavy) : .subheadline).foregroundStyle(bold ? .primary : .secondary)
            Spacer()
            value.font(bold ? .title3.weight(.heavy) : .subheadline.weight(.semibold))
        }
    }

    private var placeOrderButton: some View {
        Button {
            Task { await placeOrder() }
        } label: {
            if isPlacing {
                ProgressView().tint(.white)
            } else {
                HStack {
                    Text("Place order")
                    Spacer()
                    if let preview, isReady { Text(preview.total, format: .currency(code: "USD")) }
                }
                .padding(.horizontal)
            }
        }
        .buttonStyle(SevenButtonStyle())
        .disabled(!isReady || isPlacing)
        .opacity(isReady ? 1 : 0.6)
        .padding()
        .background(.white)
        .accessibilityIdentifier("place-order-button")
    }

    private var emptyCart: some View {
        VStack(spacing: 12) {
            Image(systemName: "bag").font(.system(size: 44)).foregroundStyle(.secondary)
            Text("Your cart is empty").font(.headline)
            Button("Keep shopping") { dismiss() }.font(.subheadline.weight(.bold)).foregroundStyle(Brand.green)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Data

    private func appliedRewards(for sku: String) -> [AppliedReward] {
        guard previewLines == store.cartLines else { return [] }
        return preview?.appliedRewards.filter { $0.sku == sku } ?? []
    }

    private func uniqueUnapplied(_ p: CheckoutPreview) -> [UnappliedReward] {
        var seen = Set<Int>()
        return p.unappliedRewards.filter { seen.insert($0.rewardId).inserted }
    }

    private func refreshPreview() async {
        let lines = store.cartLines
        guard confirmation == nil, !lines.isEmpty else {
            preview = nil
            isPreviewing = false
            return
        }
        isPreviewing = true
        try? await Task.sleep(for: .milliseconds(250))
        guard !Task.isCancelled else { return }
        do {
            let p = try await store.previewCheckout(lines)
            guard !Task.isCancelled else { return }
            preview = p
            previewLines = lines
            previewError = nil
        } catch is CancellationError {
            return
        } catch {
            guard !Task.isCancelled else { return }
            previewError = error.localizedDescription
        }
        isPreviewing = false
    }

    private func placeOrder() async {
        guard let preview, isReady else { return }
        isPlacing = true
        defer { isPlacing = false }
        do {
            let lines = previewLines
            confirmation = try await store.confirmCheckout(lines, previewToken: preview.previewToken)
        } catch let err as RedeemError where err.isStaleCheckout {
            notice = staleNotice(err.code)
            await store.load()
            refreshCount += 1
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func staleNotice(_ code: String?) -> String {
        switch code {
        case "INSUFFICIENT_POINTS": return "Your points balance changed, so we updated the rewards on this order. Review and place your order again."
        case "CART_CHANGED": return "Your cart changed. We refreshed your rewards and total."
        case "INVALID_REWARD": return "A reward is no longer available. We updated your order."
        default: return "Your checkout session expired. We refreshed your rewards and total."
        }
    }
}

struct OrderConfirmationView: View {
    let confirmation: CheckoutConfirmation
    let onDone: () -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Image(systemName: "checkmark.circle.fill").font(.system(size: 64)).foregroundStyle(Brand.green).padding(.top, 12)
                Text("Order \(confirmation.orderId) confirmed").font(.title3.weight(.heavy)).multilineTextAlignment(.center)
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Total paid").font(.caption).foregroundStyle(.secondary)
                        Text(confirmation.total, format: .currency(code: "USD")).font(.title2.weight(.heavy))
                    }
                    Spacer()
                    if confirmation.rewardSavings > 0 {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("7REWARDS savings").font(.caption).foregroundStyle(.secondary)
                            Text(confirmation.rewardSavings, format: .currency(code: "USD")).font(.title2.weight(.heavy)).foregroundStyle(Brand.green)
                        }
                    }
                }
                .padding().background(.white, in: RoundedRectangle(cornerRadius: 16))

                if !confirmation.appliedRewards.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Reward codes").font(.headline.weight(.heavy))
                        ForEach(Array(confirmation.appliedRewards.enumerated()), id: \.offset) { _, r in
                            VStack(alignment: .leading, spacing: 6) {
                                HStack {
                                    Text(r.name).font(.subheadline.weight(.bold))
                                    Spacer()
                                    Text("-\(r.pointsSpent) pts").font(.caption.weight(.bold)).foregroundStyle(Brand.red)
                                }
                                if let code = r.confirmationCode {
                                    Barcode(seed: code).frame(height: 40)
                                    Text(code).font(.caption.monospaced()).foregroundStyle(.secondary)
                                        .accessibilityIdentifier("confirmation-code")
                                }
                            }
                            .padding(12).background(Brand.background, in: RoundedRectangle(cornerRadius: 12))
                        }
                    }
                    .padding().background(.white, in: RoundedRectangle(cornerRadius: 16))
                }

                HStack {
                    Text("Points remaining").font(.subheadline.weight(.semibold))
                    Spacer()
                    Text(confirmation.remainingPoints.formatted())
                        .font(.system(size: 28, weight: .black, design: .rounded)).foregroundStyle(Brand.green)
                        .accessibilityIdentifier("remaining-points")
                }
                .padding().background(.white, in: RoundedRectangle(cornerRadius: 16))

                Button("Done", action: onDone).buttonStyle(SevenButtonStyle())
            }
            .padding()
        }
    }
}
