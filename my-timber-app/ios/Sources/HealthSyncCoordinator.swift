import Foundation
import HealthKit
import WebKit

private final class HealthSyncNetworkDelegate:NSObject,URLSessionTaskDelegate {
    func urlSession(_ session:URLSession,task:URLSessionTask,willPerformHTTPRedirection response:HTTPURLResponse,newRequest request:URLRequest,completionHandler:@escaping(URLRequest?)->Void){completionHandler(nil)}
}
final class HealthSyncCoordinator {
    private let store=HKHealthStore()
    private weak var webView:WKWebView?
    private var syncing=false
    private lazy var network:URLSession={
        let config=URLSessionConfiguration.ephemeral;config.httpShouldSetCookies=false;config.timeoutIntervalForRequest=15
        return URLSession(configuration:config,delegate:HealthSyncNetworkDelegate(),delegateQueue:nil)
    }()

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
        #if !DEBUG
        return finish("Connected health is not enabled in this build.")
        #else
        guard NavigationPolicy.healthTestingEnabled else{return finish("Health testing needs an isolated development address. No health data was read or sent.")}
        guard !syncing else{return};syncing=true
        guard HKHealthStore.isHealthDataAvailable() else{return finish("Apple Health is not available on this device.")}
        Task{
            guard let cookie=await sessionHeader() else{return finish("Sign in to the isolated test account before connecting Apple Health.")}
            do {
                let (marker,markerResponse)=try await network.data(for:URLRequest(url:URL(string:NavigationPolicy.origin+"/v1/device-health/test-environment")!))
                guard (markerResponse as? HTTPURLResponse)?.statusCode == 200,
                      let m=try JSONSerialization.jsonObject(with:marker) as? [String:Any],m["environment"] as? String == "isolated-health-test" else{return finish("The isolated health-test service could not be verified. No health data was read or sent.")}
                var check=URLRequest(url:URL(string:NavigationPolicy.origin+"/v1/device-health/status")!);check.setValue(cookie,forHTTPHeaderField:"Cookie")
                let (body,response)=try await network.data(for:check)
                guard (response as? HTTPURLResponse)?.statusCode == 200 else{return finish("Sign in again to the isolated test account before connecting Apple Health.")}
                guard let status=try JSONSerialization.jsonObject(with:body) as? [String:Any],status["trackingEnabled"] as? Bool == true else{return finish("Optional health tracking is off. Turn it on before connecting Apple Health.")}
                store.requestAuthorization(toShare:[],read:readTypes){[weak self] ok,error in
                    guard let self else{return}
                    guard error == nil,ok else{return self.finish("Apple Health permission could not be completed. You can try again from Settings.")}
                    Task{await self.sync(sessionCookie:cookie)}
                }
            }catch{finish("The health-test service could not be reached. No health data was read or sent. Please retry when connected.")}
        }
        #endif
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
                    if #available(iOS 16.0,*) {guard let stage=HKCategoryValueSleepAnalysis(rawValue:$0.value) else{return false};return [.asleepUnspecified,.asleepCore,.asleepDeep,.asleepREM].contains(stage)}
                    return $0.value==HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue
                }
                guard !asleep.isEmpty else{return continuation.resume(returning:nil)}
                guard let minutes=HealthSleepMath.latestEpisodeMinutes(asleep.map{[$0.startDate.timeIntervalSince1970,$0.endDate.timeIntervalSince1970]}) else{return continuation.resume(returning:nil)}
                let latest=asleep.map(\.endDate).max() ?? Date()
                let day=DateFormatter();day.calendar=Calendar(identifier:.gregorian);day.locale=Locale(identifier:"en_US_POSIX");day.dateFormat="yyyy-MM-dd"
                continuation.resume(returning:Reading(type:"sleep_minutes",value:minutes,observedAt:self.iso.string(from:latest),sourceRecordId:"sleep-"+day.string(from:latest)))
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
    private func sync(sessionCookie:String) async {
        let readings=await collect()
        guard !readings.isEmpty else{return finish("No recent readings were shared. Check the selected permissions and available data in Apple Health. My Timber still works without it.")}
        guard await sessionHeader() == sessionCookie else{return finish("The signed-in account changed. Nothing was uploaded. Connect again from the account you want to use.")}
        do{
            var request=URLRequest(url:URL(string:NavigationPolicy.origin+"/v1/device-health/readings")!);request.httpMethod="POST";request.setValue("application/json",forHTTPHeaderField:"Content-Type");request.setValue(NavigationPolicy.origin,forHTTPHeaderField:"Origin")
            request.httpBody=try JSONEncoder().encode(Payload(platform:"apple_health",readings:readings))
            request.setValue(sessionCookie,forHTTPHeaderField:"Cookie")
            let (body,response)=try await network.data(for:request)
            guard let http=response as? HTTPURLResponse,(200...299).contains(http.statusCode),
                  let saved=try JSONSerialization.jsonObject(with:body) as? [String:Any],saved["ok"] as? Bool == true,
                  saved["received"] as? Int == readings.count else{return finish("My Timber could not confirm the Apple Health sync. No successful save is confirmed. Please retry.")}
            finish("Apple Health readings saved to the isolated My Timber test account.",success:true)
        }catch{finish("My Timber could not confirm the Apple Health sync. Please try again.")}
    }
    private func sessionHeader() async -> String? {
        guard let host=URL(string:NavigationPolicy.origin)?.host else{return nil}
        return await withCheckedContinuation{continuation in
            DispatchQueue.main.async{[weak self] in
                guard let webView=self?.webView else{return continuation.resume(returning:nil)}
                webView.configuration.websiteDataStore.httpCookieStore.getAllCookies{cookies in
                    let selected=cookies.filter{$0.name == "sst_session" && ($0.domain.lowercased() == host || $0.domain.lowercased() == "."+host)}
                    continuation.resume(returning:selected.isEmpty ? nil : HTTPCookie.requestHeaderFields(with:selected)["Cookie"])
                }
            }
        }
    }
    private func finish(_ message:String,success:Bool=false){
        DispatchQueue.main.async{[weak self] in
            guard let self else{return};self.syncing=false
            guard let url=self.webView?.url,NavigationPolicy.classify(url.absoluteString) == .internalPage,
                  let data=try? JSONSerialization.data(withJSONObject:["message":message,"success":success]),let safe=String(data:data,encoding:.utf8) else{return}
            self.webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('myTimberHealthSync',{detail:\(safe)}));")
        }
    }
}
