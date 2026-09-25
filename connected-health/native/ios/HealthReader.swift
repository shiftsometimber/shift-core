import Foundation
import HealthKit

// Native reader only. The shipping app does not call this until the account/consent
// coordinator is wired and accepted. No networking, device-store writes or logging.
public struct TimberHealthPermit {
    public let memberID: Int
    public let connectionID: String
    public let revision: Int
    public let scopes: Set<String>
    public init(memberID: Int, connectionID: String, revision: Int, scopes: Set<String>, consentVersion: String, explicitlyConsented: Bool) throws {
        guard memberID > 0, !connectionID.isEmpty, revision > 0,
              explicitlyConsented, consentVersion == "connected-health/2026-09-24-v1",
              !scopes.isEmpty, scopes.isSubset(of: ["weight","height","steps","sleep"]) else { throw TimberHealthError.noConsent }
        self.memberID=memberID; self.connectionID=connectionID; self.revision=revision; self.scopes=scopes
    }
}
public enum TimberHealthError: Error { case noConsent, unavailable, incompleteRead }
public struct TimberHealthObservation: Codable {
    public let metric: String
    public let externalId: String
    public let value: Double
    public let unit: String
    public let startAt: String
    public let endAt: String
    public let sources: [String]
    public let basis: String
    public let timeZone: String?
}
public struct TimberHealthRead {
    public let observations: [TimberHealthObservation]
    // no_shared_data deliberately does NOT distinguish denied access from an empty store.
    public let outcomes: [String:String]
}
@available(iOS 16.0, *)
public final class TimberHealthReader {
    private let store: HKHealthStore
    public init(store: HKHealthStore = HKHealthStore()) { self.store=store }
    private func type(_ metric: String) -> HKSampleType {
        switch metric {
        case "weight": return HKObjectType.quantityType(forIdentifier:.bodyMass)!
        case "height": return HKObjectType.quantityType(forIdentifier:.height)!
        case "steps": return HKObjectType.quantityType(forIdentifier:.stepCount)!
        default: return HKObjectType.categoryType(forIdentifier:.sleepAnalysis)!
        }
    }
    // Invoke ONLY after a deliberate tap and saved first-party consent. Returning
    // normally means the permission sheet completed, not that read access was granted.
    public func requestReadAccess(_ permit: TimberHealthPermit) async throws {
        guard HKHealthStore.isHealthDataAvailable() else { throw TimberHealthError.unavailable }
        try await store.requestAuthorization(toShare: [], read: Set(permit.scopes.map { type($0) as HKObjectType }))
    }
    private func iso(_ d: Date) -> String {
        let f=ISO8601DateFormatter();f.formatOptions=[.withInternetDateTime,.withFractionalSeconds];return f.string(from:d)
    }
    private func samples(_ metric: String, from: Date, to: Date) async throws -> [HKSample] {
        try await withCheckedThrowingContinuation { continuation in
            let predicate=HKQuery.predicateForSamples(withStart:from,end:to,options:metric == "sleep" ? [] : [.strictStartDate])
            let query=HKSampleQuery(sampleType:type(metric),predicate:predicate,limit:2001,sortDescriptors:nil) { _,samples,error in
                if let error=error { continuation.resume(throwing:error);return }
                let rows=samples ?? []
                guard rows.count <= 2000 else { continuation.resume(throwing:TimberHealthError.incompleteRead);return }
                continuation.resume(returning:rows)
            }
            store.execute(query)
        }
    }
    private func stepTotals(from: Date, to: Date, calendar: Calendar) async throws -> [HKStatistics] {
        try await withCheckedThrowingContinuation { continuation in
            let query=HKStatisticsCollectionQuery(quantityType:type("steps") as! HKQuantityType,
                quantitySamplePredicate:HKQuery.predicateForSamples(withStart:from,end:to),
                options:.cumulativeSum,anchorDate:calendar.startOfDay(for:from),intervalComponents:DateComponents(day:1))
            query.initialResultsHandler={ _,collection,error in
                if let error=error { continuation.resume(throwing:error);return }
                var values:[HKStatistics]=[]
                collection?.enumerateStatistics(from:from,to:to) { value,_ in values.append(value) }
                continuation.resume(returning:values)
            }
            store.execute(query)
        }
    }
    public func read(_ permit: TimberHealthPermit, now: Date = Date(), timeZone: TimeZone = .current) async throws -> TimberHealthRead {
        guard HKHealthStore.isHealthDataAvailable() else { throw TimberHealthError.unavailable }
        var calendar=Calendar(identifier:.gregorian);calendar.timeZone=timeZone
        let start=calendar.date(byAdding:.day,value:-29,to:calendar.startOfDay(for:now))!
        let formatter=DateFormatter();formatter.calendar=calendar;formatter.timeZone=timeZone;formatter.locale=Locale(identifier:"en_US_POSIX");formatter.dateFormat="yyyy-MM-dd"
        var output:[TimberHealthObservation]=[],outcomes:[String:String]=[:]
        for metric in permit.scopes.sorted() {
            try Task.checkCancellation()
            do {
                var rows:[TimberHealthObservation]=[]
                if metric == "weight" || metric == "height" {
                    let unit:HKUnit=metric == "weight" ? .gramUnit(with:.kilo) : .meterUnit(with:.centi)
                    for sample in try await samples(metric,from:start,to:now) {
                        guard let q=sample as? HKQuantitySample else { continue }
                        rows.append(.init(metric:metric,externalId:q.uuid.uuidString,value:q.quantity.doubleValue(for:unit),unit:metric == "weight" ? "kg":"cm",startAt:iso(q.startDate),endAt:iso(q.startDate),sources:[q.sourceRevision.source.bundleIdentifier],basis:"sample",timeZone:nil))
                    }
                } else if metric == "steps" {
                    for value in try await stepTotals(from:start,to:now,calendar:calendar) {
                        guard let total=value.sumQuantity(),value.startDate<now else { continue }
                        let end=min(value.endDate,now),sources=value.sources?.map { $0.bundleIdentifier } ?? []
                        rows.append(.init(metric:metric,externalId:"steps:\(formatter.string(from:value.startDate)):\(timeZone.identifier)",value:total.doubleValue(for:.count()),unit:"count",startAt:iso(value.startDate),endAt:iso(end),sources:sources.isEmpty ? ["apple.health.aggregate"] : Array(Set(sources)).sorted(),basis:"platform_aggregate",timeZone:timeZone.identifier))
                    }
                } else {
                    let asleep:Set<Int>=[HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue,HKCategoryValueSleepAnalysis.asleepCore.rawValue,HKCategoryValueSleepAnalysis.asleepDeep.rawValue,HKCategoryValueSleepAnalysis.asleepREM.rawValue]
                    let sleep=(try await samples(metric,from:start,to:now)).compactMap { $0 as? HKCategorySample }.filter { asleep.contains($0.value) }
                    var day=start
                    while day<now {
                        let end=min(calendar.date(byAdding:.day,value:1,to:day)!,now)
                        let relevant=sleep.filter { $0.startDate<end && $0.endDate>day }
                        let intervals=relevant.map { (max($0.startDate,day),min($0.endDate,end)) }.sorted { $0.0<$1.0 }
                        var seconds=0.0,finish=day
                        for (a,b) in intervals { if b>finish { seconds+=b.timeIntervalSince(max(a,finish));finish=b } }
                        // In-bed/awake records and an absent read never become zero sleep.
                        if !intervals.isEmpty {
                            rows.append(.init(metric:metric,externalId:"sleep:\(formatter.string(from:day)):\(timeZone.identifier)",value:seconds,unit:"seconds",startAt:iso(day),endAt:iso(end),sources:Array(Set(relevant.map { $0.sourceRevision.source.bundleIdentifier })).sorted(),basis:"asleep_union",timeZone:timeZone.identifier))
                        }
                        day=end
                    }
                }
                try Task.checkCancellation()
                guard rows.allSatisfy({ $0.sources.count<=16 }) else { throw TimberHealthError.incompleteRead }
                output+=rows;outcomes[metric]=rows.isEmpty ? "no_shared_data" : "data_available"
            } catch is CancellationError { throw CancellationError() }
              catch { outcomes[metric]="read_failed" }
        }
        return TimberHealthRead(observations:output,outcomes:outcomes)
    }
}
