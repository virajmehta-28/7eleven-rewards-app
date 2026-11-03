import SwiftUI

struct DealsView: View {
    @State private var clipped: Set<UUID> = []

    var body: some View {
        VStack(spacing: 0) {
            BrandHeader(title: "Deals")
            List {
                Section {
                    ForEach(SampleData.deals) { deal in
                        HStack {
                            DealCard(deal: deal)
                            Button {
                                if clipped.contains(deal.id) { clipped.remove(deal.id) } else { clipped.insert(deal.id) }
                            } label: {
                                Image(systemName: clipped.contains(deal.id) ? "checkmark.circle.fill" : "plus.circle")
                                    .font(.title2).foregroundStyle(Brand.green)
                            }
                            .buttonStyle(.plain)
                        }
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                    }
                } header: {
                    Text("Add deals to your account, then scan your 7REWARDS barcode at checkout.").textCase(nil)
                }
            }
            .listStyle(.plain)
            .background(Brand.background)
        }
    }
}
