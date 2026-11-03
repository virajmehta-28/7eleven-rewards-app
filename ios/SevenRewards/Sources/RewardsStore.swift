import Foundation

enum RedeemError: LocalizedError {
    case server(status: Int, body: APIErrorBody?)
    case transport(String)

    var errorDescription: String? {
        switch self {
        case let .server(status, body):
            var msg = body?.message ?? "Something went wrong (HTTP \(status))."
            if let id = body?.incidentId { msg += "\n\nReference: \(id)" }
            return msg
        case let .transport(m):
            return "Can't reach 7REWARDS right now. \(m)"
        }
    }
}

@MainActor
final class RewardsStore: ObservableObject {
    @Published var member: Member?
    @Published var rewards: [Reward] = []
    @Published var redemptions: [Redemption] = []
    @Published var loadError: String?
    @Published var cart: [Product: Int] = [:]

    private let baseURL: URL = {
        let s = Bundle.main.object(forInfoDictionaryKey: "SevenRewardsAPIBaseURL") as? String ?? "http://localhost:8787"
        return URL(string: s)!
    }()

    private func request(_ path: String, method: String = "GET") -> URLRequest {
        var r = URLRequest(url: baseURL.appendingPathComponent(path))
        r.httpMethod = method
        r.setValue("application/json", forHTTPHeaderField: "Content-Type")
        r.setValue("7-Eleven-iOS/8.42.0", forHTTPHeaderField: "User-Agent")
        r.setValue("7R-00418892", forHTTPHeaderField: "X-Member-Id")
        return r
    }

    func load() async {
        do {
            let (m, _) = try await URLSession.shared.data(for: request("api/member"))
            member = try JSONDecoder().decode(Member.self, from: m)
            let (r, _) = try await URLSession.shared.data(for: request("api/rewards"))
            rewards = try JSONDecoder().decode([Reward].self, from: r)
            loadError = nil
        } catch {
            loadError = error.localizedDescription
        }
    }

    func redeem(_ reward: Reward) async throws -> Redemption {
        var req = request("api/rewards/\(reward.id)/redeem", method: "POST")
        req.httpBody = try JSONEncoder().encode(["channel": "ios", "storeId": "35187"])
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: req)
        } catch {
            throw RedeemError.transport(error.localizedDescription)
        }
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            throw RedeemError.server(status: status, body: try? JSONDecoder().decode(APIErrorBody.self, from: data))
        }
        let redemption = try JSONDecoder().decode(Redemption.self, from: data)
        member?.points = redemption.remainingPoints
        redemptions.insert(redemption, at: 0)
        return redemption
    }

    var cartCount: Int { cart.values.reduce(0, +) }
    var cartTotal: Double { cart.reduce(0) { $0 + $1.key.price * Double($1.value) } }
    func add(_ p: Product) { cart[p, default: 0] += 1 }
}
