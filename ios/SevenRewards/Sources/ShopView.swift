import SwiftUI

struct ShopView: View {
    @EnvironmentObject var store: RewardsStore
    @State private var category = "Drinks"
    private let categories = ["Drinks", "Hot Foods", "Snacks", "Essentials"]

    var body: some View {
        VStack(spacing: 0) {
            BrandHeader(title: "7NOW Delivery")
            HStack {
                Image(systemName: "mappin.circle.fill").foregroundStyle(Brand.red)
                Text("Deliver to 1200 Main St · ~25 min").font(.subheadline.weight(.semibold))
                Spacer()
            }
            .padding(.horizontal).padding(.vertical, 10).background(.white)
            Picker("Category", selection: $category) {
                ForEach(categories, id: \.self) { Text($0) }
            }
            .pickerStyle(.segmented).padding()
            List(SampleData.products.filter { $0.category == category }) { p in
                HStack(spacing: 12) {
                    Image(systemName: p.icon).font(.title2).foregroundStyle(Brand.orange)
                        .frame(width: 52, height: 52).background(Brand.orange.opacity(0.1), in: RoundedRectangle(cornerRadius: 10))
                    VStack(alignment: .leading) {
                        Text(p.name).font(.subheadline.weight(.bold))
                        Text(p.price, format: .currency(code: "USD")).font(.subheadline).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Button { store.add(p) } label: {
                        Image(systemName: "plus").font(.headline).foregroundStyle(.white)
                            .frame(width: 34, height: 34).background(Brand.green, in: Circle())
                    }
                    .buttonStyle(.plain)
                }
            }
            .listStyle(.plain)
            if store.cartCount > 0 {
                Button {} label: {
                    HStack {
                        Text("View Cart (\(store.cartCount))")
                        Spacer()
                        Text(store.cartTotal, format: .currency(code: "USD"))
                    }
                    .padding(.horizontal)
                }
                .buttonStyle(SevenButtonStyle())
                .padding()
            }
        }
        .background(Brand.background)
    }
}
