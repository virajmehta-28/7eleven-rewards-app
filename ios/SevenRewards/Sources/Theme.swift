import SwiftUI

enum Brand {
    static let green = Color(red: 0 / 255, green: 129 / 255, blue: 99 / 255)
    static let darkGreen = Color(red: 0 / 255, green: 92 / 255, blue: 70 / 255)
    static let orange = Color(red: 245 / 255, green: 128 / 255, blue: 37 / 255)
    static let red = Color(red: 238 / 255, green: 39 / 255, blue: 55 / 255)
    static let background = Color(red: 246 / 255, green: 246 / 255, blue: 244 / 255)
}

struct SevenLogo: View {
    var size: CGFloat = 34

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 0.18).fill(.white)
            VStack(spacing: 0) {
                Rectangle().fill(Brand.orange).frame(height: size * 0.2)
                Rectangle().fill(Brand.green).frame(height: size * 0.2)
                Rectangle().fill(Brand.red).frame(height: size * 0.2)
            }
            .padding(.horizontal, size * 0.08)
            Text("7")
                .font(.system(size: size * 0.82, weight: .black, design: .rounded))
                .foregroundStyle(Brand.green)
                .shadow(color: .white, radius: 0, x: 1.5, y: 1.5)
                .shadow(color: .white, radius: 0, x: -1.5, y: -1.5)
        }
        .frame(width: size, height: size)
    }
}

struct BrandHeader: View {
    let title: String

    var body: some View {
        HStack(spacing: 10) {
            SevenLogo(size: 30)
            Text(title).font(.title3.weight(.heavy)).foregroundStyle(.white)
            Spacer()
            Image(systemName: "bell.fill").foregroundStyle(.white)
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
        .background(Brand.green)
    }
}

struct PointsPill: View {
    let points: Int

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "star.fill").font(.caption2)
            Text("\(points.formatted()) pts").font(.caption.weight(.bold))
        }
        .padding(.horizontal, 10).padding(.vertical, 5)
        .background(Brand.orange, in: Capsule())
        .foregroundStyle(.white)
    }
}

struct Barcode: View {
    let seed: String

    var body: some View {
        GeometryReader { geo in
            let bars = seed.unicodeScalars.flatMap { s -> [Int] in
                let v = Int(s.value)
                return [v % 3 + 1, (v / 3) % 2 + 1, v % 4 + 1, (v / 5) % 3 + 1]
            }
            let total = CGFloat(bars.reduce(0, +))
            HStack(spacing: 0) {
                ForEach(Array(bars.enumerated()), id: \.offset) { i, w in
                    Rectangle()
                        .fill(i.isMultiple(of: 2) ? Color.black : Color.white)
                        .frame(width: geo.size.width * CGFloat(w) / total)
                }
            }
        }
    }
}
