import UIKit
import WebKit
import UserNotifications

/// Generic local reminders only; no medicine or medical data stored in notifications.
final class TreatmentBridge: NSObject, WKScriptMessageHandler {
    private weak var owner:UIViewController?
    private weak var web:WKWebView?
    private let centre=UNUserNotificationCenter.current()
    private let prefix="my-timber-treatment-"
    private var files=[URL]()
    private var generation=0
    private var epoch=0
    init(owner:UIViewController){self.owner=owner}
    func attach(_ web:WKWebView){self.web=web}
    func cancel(){generation += 1}
    private func clear(){
        epoch += 1;let ticket=epoch
        centre.getPendingNotificationRequests { items in DispatchQueue.main.async { guard ticket==self.epoch else{return};self.centre.removePendingNotificationRequests(withIdentifiers:items.filter{$0.identifier.hasPrefix(self.prefix)}.map{$0.identifier}) } }
        centre.getDeliveredNotifications { items in self.centre.removeDeliveredNotifications(withIdentifiers:items.filter{$0.request.identifier.hasPrefix(self.prefix)}.map{$0.request.identifier}) }
    }
    func userContentController(_ controller:WKUserContentController,didReceive message:WKScriptMessage){
        guard message.frameInfo.isMainFrame,let u=message.frameInfo.request.url,
              u.scheme=="https",u.host=="shiftsometimber.co.uk",u.user==nil,u.password==nil,(u.port==nil||u.port==443),
              web?.url?.host==u.host,let body=message.body as? [String:Any],
              let request=body["requestId"] as? String,UUID(uuidString:request) != nil,
              let action=body["action"] as? String else{return}
        let token=generation
        func reply(_ error:String?=nil){
            DispatchQueue.main.async {
                guard self.generation==token else{return}
                var result:[String:Any]=["requestId":request];if let error=error{result["error"]=error}
                if let bytes=try? JSONSerialization.data(withJSONObject:result),let json=String(data:bytes,encoding:.utf8){self.web?.evaluateJavaScript("window.SST_NATIVE_TREATMENT_RESULT?.(\(json))")}
            }
        }
        if action=="disable"{UserDefaults.standard.set(false,forKey:"treatmentReminders");clear();reply();return}
        guard (action=="sync" && u.path.hasPrefix("/member/")) || (u.path=="/member/treatment" && web?.url?.path==u.path) else{reply("Open My Treatment first.");return}
        if action=="enable"{
            centre.requestAuthorization(options:[.alert,.sound]){granted,_ in
                guard self.generation==token else{return}
                UserDefaults.standard.set(granted,forKey:"treatmentReminders")
                reply(granted ? nil : "Allow notifications in your iPhone settings to enable reminders.")
            };return
        }
        if action=="sync"{
            guard let account=body["account"] as? String,account.count<=20,Int(account) != nil,let rows=body["reminders"] as? [[String:Any]],rows.count<=32 else{reply("Invalid reminders.");return}
            if UserDefaults.standard.string(forKey:"treatmentAccount") != account{UserDefaults.standard.set(false,forKey:"treatmentReminders");UserDefaults.standard.set(account,forKey:"treatmentAccount")}
            epoch += 1;let ticket=epoch
            var requests=[UNNotificationRequest]()
            for row in rows{
                guard let id=row["id"] as? String,UUID(uuidString:id) != nil,let at=row["at"] as? Double,at.isFinite else{reply("Invalid reminder.");return}
                let date=Date(timeIntervalSince1970:at/1000),delay=date.timeIntervalSinceNow
                guard delay>0,delay<=86400 else{continue}
                let content=UNMutableNotificationContent();content.title="My Timber";content.body="Your recorded scheduled time has arrived. Open My Timber to review your instructions.";content.sound = .default
                requests.append(UNNotificationRequest(identifier:prefix+id,content:content,trigger:UNTimeIntervalNotificationTrigger(timeInterval:delay,repeats:false)))
            }
            centre.getPendingNotificationRequests{items in
                DispatchQueue.main.async{
                    guard self.generation==token,self.epoch==ticket else{return}
                    self.centre.removePendingNotificationRequests(withIdentifiers:items.filter{$0.identifier.hasPrefix(self.prefix)}.map{$0.identifier})
                    guard UserDefaults.standard.bool(forKey:"treatmentReminders") else{reply();return}
                    let group=DispatchGroup();var failed=false
                    for item in requests{group.enter();self.centre.add(item){error in DispatchQueue.main.async{if error != nil{failed=true};group.leave()}}}
                    group.notify(queue:.main){reply(failed ? "Some phone reminders could not be scheduled." : nil)}
                }
            };return
        }
        if action=="pdf"{
            guard let raw=body["base64"] as? String,raw.count<=2666668,let bytes=Data(base64Encoded:raw),bytes.count<=2000000,bytes.starts(with:Data("%PDF-".utf8)),let owner=owner,owner.presentedViewController==nil else{reply("The PDF could not be opened.");return}
            do{
                let dir=FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString,isDirectory:true)
                try FileManager.default.createDirectory(at:dir,withIntermediateDirectories:true)
                let file=dir.appendingPathComponent("my-timber-summary.pdf");try bytes.write(to:file,options:.completeFileProtection);files.append(dir)
                let share=UIActivityViewController(activityItems:[file],applicationActivities:nil)
                share.completionWithItemsHandler={_,_,_,_ in try? FileManager.default.removeItem(at:dir);reply()}
                share.popoverPresentationController?.sourceView=owner.view
                owner.present(share,animated:true)
            }catch{reply("The PDF could not be saved.")};return
        }
        reply("Unknown phone action.")
    }
    deinit{for file in files{try? FileManager.default.removeItem(at:file)}}
}
