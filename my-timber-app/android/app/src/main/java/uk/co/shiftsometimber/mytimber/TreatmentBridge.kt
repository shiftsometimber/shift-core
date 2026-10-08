package uk.co.shiftsometimber.mytimber

import android.Manifest
import android.app.*
import android.content.*
import android.content.pm.PackageManager
import android.os.Build
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.FileProvider
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import org.json.JSONObject
import java.io.File
import java.util.UUID

class TreatmentBridge(private val owner:ComponentActivity,private val web:WebView) {
 private var generation=0
 private var afterPermission:((Boolean)->Unit)?=null
 private val launcher=owner.registerForActivityResult(ActivityResultContracts.RequestPermission()){afterPermission?.invoke(it);afterPermission=null}
 private val prefs=owner.getSharedPreferences("treatment",Context.MODE_PRIVATE)
 private fun trusted():Boolean=web.url?.let{NavigationPolicy.classify(it)==NavigationPolicy.Decision.INTERNAL}?:false
 fun cancel(){generation++;afterPermission=null}
 fun attach(){
  if(!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER))return
  File(owner.cacheDir,"treatment-pdf").deleteRecursively()
  WebViewCompat.addWebMessageListener(web,"sstTreatment",setOf("https://shiftsometimber.co.uk")){_,message,origin,main,proxy ->
   if(!main||origin.toString()!="https://shiftsometimber.co.uk"||!trusted())return@addWebMessageListener
   val raw=message.data?:return@addWebMessageListener
   if(raw.length>2670000)return@addWebMessageListener
   val body=runCatching{JSONObject(raw)}.getOrNull()?:return@addWebMessageListener
   val id=body.optString("requestId");if(runCatching{UUID.fromString(id)}.isFailure)return@addWebMessageListener
   val token=generation
   fun reply(error:String?=null){if(generation==token&&trusted()){val result=JSONObject().put("requestId",id);if(error!=null)result.put("error",error);proxy.postMessage(result.toString())}}
   try{
    when(body.optString("action")){
     "disable"->{prefs.edit().putBoolean("enabled",false).apply();clear(owner);reply()}
     else->{
      if(android.net.Uri.parse(web.url).path!="/member/treatment" && !(body.optString("action")=="sync"&&android.net.Uri.parse(web.url).path?.startsWith("/member/")==true)){reply("Open My Treatment first.");return@addWebMessageListener}
      when(body.optString("action")){
       "enable"->{
        val nm=owner.getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(NotificationChannel("treatment","My Timber reminders",NotificationManager.IMPORTANCE_DEFAULT))
        fun done(granted:Boolean){if(generation==token){val enabled=granted&&nm.areNotificationsEnabled();prefs.edit().putBoolean("enabled",enabled).apply();reply(if(enabled)null else "Allow notifications in your phone settings to enable reminders.")}}
        if(Build.VERSION.SDK_INT>=33&&owner.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED){afterPermission={done(it)};launcher.launch(Manifest.permission.POST_NOTIFICATIONS)}else done(true)
       }
       "sync"->{
        val account=body.getString("account");require(account.length<=20&&account.toLongOrNull()!=null)
        if(prefs.getString("account",null)!=account)prefs.edit().putString("account",account).putBoolean("enabled",false).apply()
        val rows=body.getJSONArray("reminders");require(rows.length()<=32)
        val now=System.currentTimeMillis();val accepted=mutableListOf<Pair<String,Long>>()
        for(i in 0 until rows.length()){val row=rows.getJSONObject(i);val key=row.getString("id");UUID.fromString(key);val at=row.getDouble("at");require(at.isFinite());if(at>now&&at<=now+86400000)accepted.add(key to at.toLong())}
        clear(owner)
        if(prefs.getBoolean("enabled",false)){
         prefs.edit().putStringSet("ids",accepted.map{it.first}.toSet()).apply()
         val alarms=owner.getSystemService(AlarmManager::class.java)
         for((key,at)in accepted)alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pending(owner,key))
        };reply()
       }
       "pdf"->{
        val encoded=body.getString("base64");require(encoded.length<=2666668)
        val bytes=android.util.Base64.decode(encoded,android.util.Base64.DEFAULT);require(bytes.size<=2000000&&String(bytes.take(5).toByteArray())=="%PDF-")
        val dir=File(owner.cacheDir,"treatment-pdf/${UUID.randomUUID()}");dir.mkdirs()
        val file=File(dir,"my-timber-summary.pdf");file.writeBytes(bytes)
        val uri=FileProvider.getUriForFile(owner,owner.packageName+".treatment-files",file)
        val send=Intent(Intent.ACTION_SEND).setType("application/pdf").putExtra(Intent.EXTRA_STREAM,uri).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        send.clipData=ClipData.newRawUri("My Timber summary",uri)
        owner.startActivity(Intent.createChooser(send,"Save or share your summary"));reply()
       }
       else->reply("Unknown phone action.")
      }
     }
    }
   }catch(_:Exception){reply("The phone action could not be completed.")}
  }
 }
 companion object{
  fun pending(context:Context,id:String):PendingIntent=PendingIntent.getBroadcast(context,0,Intent(context,TreatmentReminderReceiver::class.java).setData(android.net.Uri.parse("mytimber-reminder:///$id")),PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  fun clear(context:Context){
   val prefs=context.getSharedPreferences("treatment",Context.MODE_PRIVATE)
   val alarms=context.getSystemService(AlarmManager::class.java)
   val nm=context.getSystemService(NotificationManager::class.java)
   for(id in prefs.getStringSet("ids",emptySet())?:emptySet()){alarms.cancel(pending(context,id));nm.cancel(id,1)}
   prefs.edit().remove("ids").apply()
  }
 }
}
class TreatmentReminderReceiver:BroadcastReceiver(){
 override fun onReceive(context:Context,intent:Intent){
  val id=intent.data?.lastPathSegment?:return
  val prefs=context.getSharedPreferences("treatment",Context.MODE_PRIVATE)
  if(!prefs.getBoolean("enabled",false)||id !in (prefs.getStringSet("ids",emptySet())?:emptySet()))return
  val open=PendingIntent.getActivity(context,0,Intent(context,MainActivity::class.java).putExtra("treatmentReminder",true),PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  val notification=Notification.Builder(context,"treatment").setSmallIcon(uk.co.shiftsometimber.mytimber.R.drawable.my_timber_icon).setContentTitle("My Timber").setContentText("Your recorded scheduled time has arrived. Open My Timber to review your instructions.").setVisibility(Notification.VISIBILITY_PRIVATE).setContentIntent(open).setAutoCancel(true).build()
  try{context.getSystemService(NotificationManager::class.java).notify(id,1,notification)}catch(_:SecurityException){}
 }
}
