import UIKit
import WebKit
import HealthKit

/// Read-only, foreground previews. No background delivery or native upload.
final class HealthBridge: NSObject, WKScriptMessageHandler {
    private let store=HKHealthStore()
    private weak var owner:UIViewController?
    private weak var web:WKWebView?
    private var generation=UUID()
    private var busy=false
    init(owner:UIViewController){self.owner=owner}
    func attach(_ web:WKWebView){self.web=web}
    func cancel(){generation=UUID();busy=false}
    private func trusted(_ url:URL?)->Bool{
        guard let u=url,u.scheme=="https",u.host=="shiftsometimber.co.uk",u.user==nil,u.password==nil,(u.port==nil||u.port==443) else{return false}
        return ["/member/settings","/member/settings.html","/member/settings/"].contains(u.path)
    }
    func userContentController(_ controller:WKUserContentController,didReceive message:WKScriptMessage){
        guard message.frameInfo.isMainFrame,trusted(message.frameInfo.request.url),trusted(web?.url),
              let body=message.body as? [String:Any],body.count==3,body["action"] as? String=="read",
              let request=body["requestId"] as? String,UUID(uuidString:request) != nil,
              let account=body["accountId"] as? Int,account>0,account<9007199254740992,!busy,
              let owner=owner,owner.presentedViewController==nil else{return}
        let token=generation;busy=true
        let reply:([String:Any])->Void = { [weak self] result in
            DispatchQueue.main.async {
                guard let self=self,self.generation==token,self.trusted(self.web?.url) else{return}
                self.busy=false
                var payload=result;payload["requestId"]=request;payload["accountId"]=account
                guard let bytes=try? JSONSerialization.data(withJSONObject:payload),let json=String(data:bytes,encoding:.utf8) else{return}
                self.web?.evaluateJavaScript("window.SST_NATIVE_HEALTH_RESULT?.(\(json))",completionHandler:nil)
            }
        }
        guard HKHealthStore.isHealthDataAvailable() else{reply(["error":"Apple Health is unavailable on this device."]);return}
        let alert=UIAlertController(title:"Preview Apple Health readings?",message:"Read up to the latest 50 heart-rate, 50 blood-pressure and 50 weight readings from the last 30 days. You will review them before choosing what to save to My Timber. No data is written to Apple Health.",preferredStyle:.alert)
        alert.addAction(UIAlertAction(title:"Cancel",style:.cancel){_ in reply(["error":"Preview cancelled. Nothing imported."])})
        alert.addAction(UIAlertAction(title:"Continue",style:.default){[weak self] _ in
            guard let self=self,self.generation==token else{return}
            let hr=HKObjectType.quantityType(forIdentifier:.heartRate)!,sys=HKObjectType.quantityType(forIdentifier:.bloodPressureSystolic)!,dia=HKObjectType.quantityType(forIdentifier:.bloodPressureDiastolic)!,weight=HKObjectType.quantityType(forIdentifier:.bodyMass)!
            self.store.requestAuthorization(toShare:[],read:[hr,sys,dia,weight]){ok,error in
                guard ok,error==nil else{reply(["error":"Apple Health access could not be requested. Nothing imported."]);return}
                // Completion only means the permission sheet completed, not read access granted.
                self.read(hr:hr,sys:sys,dia:dia,weight:weight,reply:reply)
            }
        })
        owner.present(alert,animated:true)
    }
    private func read(hr:HKQuantityType,sys:HKQuantityType,dia:HKQuantityType,weight:HKQuantityType,reply:@escaping([String:Any])->Void){
        let start=Date().addingTimeInterval(-30*86400),end=Date(),group=DispatchGroup(),lock=NSLock()
        let predicate=HKQuery.predicateForSamples(withStart:start,end:end,options:.strictStartDate)
        let sort=[NSSortDescriptor(key:HKSampleSortIdentifierStartDate,ascending:false)]
        var readings=[[String:Any]](),failed=false
        let iso=ISO8601DateFormatter()
        for type in [hr as HKSampleType,HKObjectType.correlationType(forIdentifier:.bloodPressure)! as HKSampleType,weight as HKSampleType]{
            group.enter()
            let query=HKSampleQuery(sampleType:type,predicate:predicate,limit:50,sortDescriptors:sort){_,samples,error in
                lock.lock();defer{lock.unlock();group.leave()}
                if error != nil{failed=true;return}
                for sample in samples ?? []{
                    var row:[String:Any]=["id":sample.uuid.uuidString,"at":iso.string(from:sample.startDate),"source":String(sample.sourceRevision.source.name.prefix(100))]
                    if let value=sample as? HKQuantitySample{
                        if value.quantityType==weight{row["kind"]="weight";row["weightKg"]=value.quantity.doubleValue(for:.gramUnit(with:.kilo))}
                        else{row["kind"]="heart_rate";row["heartRate"]=value.quantity.doubleValue(for:HKUnit.count().unitDivided(by:.minute()))}
                    }else if let bp=sample as? HKCorrelation,
                        let s=bp.objects(for:sys).first as? HKQuantitySample,
                        let d=bp.objects(for:dia).first as? HKQuantitySample{
                        row["kind"]="blood_pressure";row["systolic"]=s.quantity.doubleValue(for:.millimeterOfMercury());row["diastolic"]=d.quantity.doubleValue(for:.millimeterOfMercury())
                    }else{continue}
                    readings.append(row)
                }
            }
            store.execute(query)
        }
        group.notify(queue:.main){if failed{reply(["error":"Apple Health readings could not be read. Nothing imported."])}else{reply(["readings":readings,"platform":"apple_health"])} }
    }
}
