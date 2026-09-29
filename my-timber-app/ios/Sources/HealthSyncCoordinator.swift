import Foundation
import HealthKit
import WebKit

final class HealthSyncCoordinator {
    private let store=HKHealthStore()
    private weak var webView:WKWebView?
    private let endpoint=URL(string:"https://shiftsometimber.co.uk/v1/device-health/readings")!

    init(webView:WKWebView){self.webView=webView}

    private struct Reading:Encodable {
        let type:String
        let value:Double
        let observedAt:String
        let sourceRecordId:String
    }
    private struct Payload:Encodable {let platform:String;let readings:[Reading]}
    private let iso=ISO8601DateFormatter()

    private var readTypes:Set<HKObjectType> {
        var out:Set<HKObjectType>=[]
        let quantity:[HKQuantityTypeIdentifier]=[
            .bodyMass,.bodyFatPercentage,.bloodPressureSystolic,.bloodPressureDiastolic,
            .heartRate,.restingHeartRate,.oxygenSaturation,.respiratoryRate,.bodyTemperature,
            .stepCount,.activeEnergyBurned,.distanceWalkingRunning
        ]
        quantity.compactMap{HKObjectType.quantityType(forIdentifier:$0)}.forEach{out.insert($0)}
        if let sleep=HKObjectType.categoryType(forIdentifier:.sleepAnalysis){out.insert(sleep)}
        if let workout=HKObjectType.workoutType() as HKObjectType?{out.insert(workout)}
        return out
    }

    func connectAndSync(){
        guard HKHealthStore.isHealthDataAvailable() else{return finish("Apple Health is not available on this device.")}
        store.requestAuthorization(toShare:[],read:readTypes){[weak self] ok,error in
            guard let self else{return}
            if let error{return self.finish("Apple Health permission could not be completed: \(error.localizedDescription)")}
            guard ok else{return self.finish("Apple Health was not connected. You can try again from Settings.")}
            Task{await self.sync()}
        }
    }

    private func latest(_ id:HKQuantityTypeIdentifier,unit:HKUnit,type:String) async -> Reading? {
        guard let sampleType=HKObjectType.quantityType(forIdentifier:id) else{return nil}
        return await withCheckedContinuation{continuation in
            let start=Calendar.current.date(byAdding:.day,value:-30,to:Date())!
            let predicate=HKQuery.predicateForSamples(withStart:start,end:Date(),options:.strictEndDate)
            let query=HKSampleQuery(sampleType:sampleType,predicate:predicate,limit:1,sortDescriptors:[NSSortDescriptor(key:HKSampleSortIdentifierEndDate,ascending:false)]){_,samples,_ in
                guard let sample=samples?.first as? HKQuantitySample else{return continuation.resume(returning:nil)}
                continuation.resume(returning:Reading(type:type,value:sample.quantity.doubleValue(for:unit),observedAt:self.iso.string(from:sample.endDate),sourceRecordId:sample.uuid.uuidString))
            };store.execute(query)
        }
    }
    private func todayTotal(_ id:HKQuantityTypeIdentifier,unit:HKUnit,type:String) async -> Reading? {
        guard let sampleType=HKObjectType.quantityType(forIdentifier:id) else{return nil}
        return await withCheckedContinuation{continuation in
            let start=Calendar.current.startOfDay(for:Date()),predicate=HKQuery.predicateForSamples(withStart:start,end:Date(),options:.strictStartDate)
            let query=HKStatisticsQuery(quantityType:sampleType,quantitySamplePredicate:predicate,options:.cumulativeSum){_,stats,_ in
                guard let value=stats?.sumQuantity()?.doubleValue(for:unit) else{return continuation.resume(returning:nil)}
                let day=DateFormatter();day.calendar=Calendar(identifier:.gregorian);day.locale=Locale(identifier:"en_US_POSIX");day.dateFormat="yyyy-MM-dd"
                continuation.resume(returning:Reading(type:type,value:value,observedAt:self.iso.string(from:Date()),sourceRecordId:type+"-"+day.string(from:start)))
            };store.execute(query)
        }
    }
    private func sleepMinutes() async -> Reading? {
        guard let type=HKObjectType.categoryType(forIdentifier:.sleepAnalysis) else{return nil}
        return await withCheckedContinuation{continuation in
            let start=Calendar.current.date(byAdding:.day,value:-2,to:Date())!,predicate=HKQuery.predicateForSamples(withStart:start,end:Date(),options:.strictEndDate)
            let query=HKSampleQuery(sampleType:type,predicate:predicate,limit:HKObjectQueryNoLimit,sortDescriptors:nil){_,samples,_ in
                let asleep=(samples as? [HKCategorySample] ?? []).filter{
                    if #available(iOS 16.0,*) {return [.asleepUnspecified,.asleepCore,.asleepDeep,.asleepREM].contains(HKCategoryValueSleepAnalysis(rawValue:$0.value)!)}
                    return $0.value==HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue
                }
                guard !asleep.isEmpty else{return continuation.resume(returning:nil)}
                let seconds=asleep.reduce(0){$0+$1.endDate.timeIntervalSince($1.startDate)},latest=asleep.map(\.endDate).max() ?? Date()
                let day=DateFormatter();day.calendar=Calendar(identifier:.gregorian);day.locale=Locale(identifier:"en_US_POSIX");day.dateFormat="yyyy-MM-dd"
                continuation.resume(returning:Reading(type:"sleep_minutes",value:seconds/60,observedAt:self.iso.string(from:latest),sourceRecordId:"sleep-"+day.string(from:latest)))
            };store.execute(query)
        }
    }
    private func exerciseMinutes() async -> Reading? {
        await withCheckedContinuation{continuation in
            let start=Calendar.current.startOfDay(for:Date()),predicate=HKQuery.predicateForSamples(withStart:start,end:Date(),options:.strictStartDate)
            let query=HKSampleQuery(sampleType:.workoutType(),predicate:predicate,limit:HKObjectQueryNoLimit,sortDescriptors:nil){_,samples,_ in
                let workouts=samples as? [HKWorkout] ?? [];guard !workouts.isEmpty else{return continuation.resume(returning:nil)}
                let minutes=workouts.reduce(0){$0+$1.duration}/60
                let day=DateFormatter();day.calendar=Calendar(identifier:.gregorian);day.locale=Locale(identifier:"en_US_POSIX");day.dateFormat="yyyy-MM-dd"
                continuation.resume(returning:Reading(type:"exercise_minutes",value:minutes,observedAt:self.iso.string(from:Date()),sourceRecordId:"exercise-"+day.string(from:start)))
            };store.execute(query)
        }
    }
    private func collect() async -> [Reading] {
        var out:[Reading]=[]
        let latestSpecs:[(HKQuantityTypeIdentifier,HKUnit,String)]=[
            (.bodyMass,.gramUnit(with:.kilo),"weight_kg"),(.bodyFatPercentage,.percent(),"body_fat_pct"),
            (.bloodPressureSystolic,.millimeterOfMercury(),"systolic_mmhg"),(.bloodPressureDiastolic,.millimeterOfMercury(),"diastolic_mmhg"),
            (.heartRate,HKUnit.count().unitDivided(by:.minute()),"heart_rate_bpm"),(.restingHeartRate,HKUnit.count().unitDivided(by:.minute()),"resting_heart_rate_bpm"),
            (.oxygenSaturation,.percent(),"oxygen_saturation_pct"),(.respiratoryRate,HKUnit.count().unitDivided(by:.minute()),"respiratory_rate_bpm"),
            (.bodyTemperature,.degreeCelsius(),"body_temperature_c")
        ]
        for spec in latestSpecs {if var r=await latest(spec.0,unit:spec.1,type:spec.2){if spec.0 == .bodyFatPercentage || spec.0 == .oxygenSaturation {r=Reading(type:r.type,value:r.value*100,observedAt:r.observedAt,sourceRecordId:r.sourceRecordId)};out.append(r)}}
        if let r=await todayTotal(.stepCount,unit:.count(),type:"steps"){out.append(r)}
        if let r=await todayTotal(.activeEnergyBurned,unit:.kilocalorie(),type:"active_energy_kcal"){out.append(r)}
        if let r=await todayTotal(.distanceWalkingRunning,unit:.meter(),type:"distance_m"){out.append(r)}
        if let r=await sleepMinutes(){out.append(r)}
        if let r=await exerciseMinutes(){out.append(r)}
        return out
    }
    private func sync() async {
        let readings=await collect()
        guard !readings.isEmpty else{return finish("Apple Health is connected. There are no supported recent readings to sync yet.")}
        do{
            var request=URLRequest(url:endpoint);request.httpMethod="POST";request.setValue("application/json",forHTTPHeaderField:"Content-Type");request.setValue("https://shiftsometimber.co.uk",forHTTPHeaderField:"Origin")
            request.httpBody=try JSONEncoder().encode(Payload(platform:"apple_health",readings:readings))
            let cookies=await cookiesForSite();let fields=HTTPCookie.requestHeaderFields(with:cookies);for(k,v)in fields{request.setValue(v,forHTTPHeaderField:k)}
            let (_,response)=try await URLSession.shared.data(for:request)
            guard let http=response as? HTTPURLResponse,(200...299).contains(http.statusCode) else{return finish("Apple Health connected, but My Timber could not confirm the sync. Please try again.")}
            finish("Apple Health synced with My Timber.")
        }catch{finish("My Timber could not confirm the Apple Health sync. Please try again.")}
    }
    private func cookiesForSite() async -> [HTTPCookie] {
        guard let webView else{return []}
        return await withCheckedContinuation{continuation in webView.configuration.websiteDataStore.httpCookieStore.getAllCookies{cookies in continuation.resume(returning:cookies.filter{$0.domain.contains("shiftsometimber.co.uk")})}}
    }
    private func finish(_ message:String){
        DispatchQueue.main.async{[weak self] in
            guard let self else{return};let safe=message.replacingOccurrences(of:"\\",with:"\\\\").replacingOccurrences(of:"'",with:"\\'")
            self.webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('myTimberHealthSync',{detail:{message:'\(safe)'}}));")
            if self.webView?.url?.path == "/member/settings" {self.webView?.reload()}
        }
    }
}
