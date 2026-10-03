package uk.co.shiftsometimber.mytimber

import android.app.AlertDialog
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.BloodPressureRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import kotlinx.coroutines.*
import org.json.JSONObject
import org.json.JSONArray
import java.time.Instant
import java.util.UUID
import java.security.MessageDigest

/** Origin-scoped, main-frame-only read preview. No JavascriptInterface or background sync. */
class HealthBridge(private val owner: ComponentActivity, private val web: WebView) {
    private val scope=CoroutineScope(SupervisorJob()+Dispatchers.Main)
    private var generation=0
    private var busy=false
    private var afterPermission:(()->Unit)?=null
    private val permissions=setOf(HealthPermission.getReadPermission(HeartRateRecord::class),HealthPermission.getReadPermission(BloodPressureRecord::class),HealthPermission.getReadPermission(WeightRecord::class))
    private val launcher=owner.registerForActivityResult(PermissionController.createRequestPermissionResultContract()) { afterPermission?.invoke();afterPermission=null }
    private fun trusted()=web.url?.let { url ->
        val uri=android.net.Uri.parse(url)
        uri.scheme=="https"&&uri.host=="shiftsometimber.co.uk"&&(uri.port==-1||uri.port==443)&&uri.userInfo==null&&uri.path in setOf("/member/settings","/member/settings.html","/member/settings/")
    } ?: false
    fun attach(){
        if(!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER))return
        WebViewCompat.addWebMessageListener(web,"sstHealth",setOf("https://shiftsometimber.co.uk")) { _,message,origin,isMainFrame,proxy ->
            if(!isMainFrame||origin.toString()!="https://shiftsometimber.co.uk"||!trusted()||busy)return@addWebMessageListener
            val body=try{JSONObject(message.data ?: "")}catch(_:Exception){return@addWebMessageListener}
            val request=body.optString("requestId")
            val account=body.optDouble("accountId",0.0)
            if(body.length()!=3||body.optString("action")!="read"||account<=0||account>=9007199254740992.0||account!=kotlin.math.floor(account)||runCatching{UUID.fromString(request)}.isFailure)return@addWebMessageListener
            val token=generation;busy=true
            val reply:(JSONObject)->Unit={result ->
                if(token==generation&&trusted()){
                    busy=false
                    result.put("requestId",request).put("accountId",account.toLong())
                    proxy.postMessage(result.toString())
                }
            }
            if(HealthConnectClient.getSdkStatus(owner)!=HealthConnectClient.SDK_AVAILABLE){reply(JSONObject().put("error","Health Connect is unavailable. Install or update Health Connect in your phone settings."));return@addWebMessageListener}
            val client=HealthConnectClient.getOrCreate(owner)
            val read:()->Unit={scope.launch{
                try{
                    val granted=client.permissionController.getGrantedPermissions()
                    val now=Instant.now();val range=TimeRangeFilter.between(now.minusSeconds(30L*86400),now)
                    val readings=mutableListOf<JSONObject>()
                    fun id(raw:String)=MessageDigest.getInstance("SHA-256").digest(raw.toByteArray()).joinToString(""){"%02x".format(it)}
                    fun row(raw:String,kind:String,at:Instant,source:String)=JSONObject().put("id",id(raw)).put("kind",kind).put("at",at.toString()).put("source",source.take(100).ifEmpty{"Health Connect"})
                    if(HealthPermission.getReadPermission(HeartRateRecord::class) in granted){
                        val records=client.readRecords(ReadRecordsRequest(HeartRateRecord::class,range,ascendingOrder=false,pageSize=50)).records
                        records.flatMap { r -> r.samples.takeLast(50).map { s -> row(r.metadata.id+":"+s.time,"heart_rate",s.time,r.metadata.dataOrigin.packageName).put("heartRate",s.beatsPerMinute) } }
                            .sortedByDescending{it.getString("at")}.take(50).forEach{readings.add(it)}
                    }
                    if(HealthPermission.getReadPermission(BloodPressureRecord::class) in granted){
                        client.readRecords(ReadRecordsRequest(BloodPressureRecord::class,range,ascendingOrder=false,pageSize=50)).records.forEach { r ->
                            readings.add(row(r.metadata.id,"blood_pressure",r.time,r.metadata.dataOrigin.packageName).put("systolic",r.systolic.inMillimetersOfMercury).put("diastolic",r.diastolic.inMillimetersOfMercury))
                        }
                    }
                    if(HealthPermission.getReadPermission(WeightRecord::class) in granted){
                        client.readRecords(ReadRecordsRequest(WeightRecord::class,range,ascendingOrder=false,pageSize=50)).records.forEach { r ->
                            readings.add(row(r.metadata.id,"weight",r.time,r.metadata.dataOrigin.packageName).put("weightKg",r.weight.inKilograms))
                        }
                    }
                    // Recheck on each preview; a denied type contributes no invented readings.
                    reply(JSONObject().put("platform","health_connect").put("readings",JSONArray(readings)))
                }catch(_:Exception){reply(JSONObject().put("error","Health Connect readings could not be read. Nothing imported."))}
            }}
            AlertDialog.Builder(owner).setTitle("Preview Health Connect readings?")
                .setMessage("Read up to 50 heart-rate, 50 blood-pressure and 50 weight readings from the last 30 days. You will review them before choosing what to save. No data is written to Health Connect.")
                .setNegativeButton("Cancel"){_,_->reply(JSONObject().put("error","Preview cancelled. Nothing imported."))}
                .setOnCancelListener{reply(JSONObject().put("error","Preview cancelled. Nothing imported."))}
                .setPositiveButton("Continue"){_,_->scope.launch{
                    if(token!=generation)return@launch
                    try{
                        if(client.permissionController.getGrantedPermissions().containsAll(permissions))read()
                        else {afterPermission={if(token==generation)read()};launcher.launch(permissions)}
                    }catch(_:Exception){reply(JSONObject().put("error","Health Connect permissions could not be requested."))}
                }}.show()
        }
    }
    fun cancel(){generation++;busy=false;afterPermission=null}
    fun close(){cancel();scope.cancel()}
}
