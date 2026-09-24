package uk.co.shiftsometimber.mytimber.health

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.widget.*
import androidx.activity.ComponentActivity
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.*
import org.json.JSONArray
import org.json.JSONObject
import java.net.URL
import javax.net.ssl.HttpsURLConnection
import java.util.UUID

private const val ORIGIN="https://shiftsometimber.co.uk"
private const val VERSION="connected-health/2026-09-24-v1"

// No JS bridge, credentials in intents, persistent health buffers, or OS writes.
class ConnectedHealthActivity:ComponentActivity() {
    private val cream=Color.rgb(231,227,218)
    private lateinit var status:TextView
    private lateinit var action:Button
    private lateinit var agreement:CheckBox
    private val choices=linkedMapOf<String,CheckBox>()
    private var session=""
    private var account=0
    private var connection:JSONObject?=null
    private var job:Job?=null
    private var waitingPermission=false
    private var resumed=false
    private var readyToRead=false
    private var permit:HealthPermit?=null
    private val permissionLauncher=registerForActivityResult(PermissionController.createRequestPermissionResultContract()) {
        waitingPermission=false;readyToRead=true
        if(resumed)beginRead()
    }
    private fun text(s:String)=TextView(this).apply { text=s;textSize=16f;setTextColor(cream);setPadding(0,8,0,8) }
    override fun onCreate(savedInstanceState:Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        val root=LinearLayout(this).apply { orientation=LinearLayout.VERTICAL;setPadding(24,24,24,24);setBackgroundColor(Color.rgb(5,5,5)) }
        val scroll=ScrollView(this);scroll.addView(root);setContentView(scroll)
        root.addView(text("Connect Health Connect"))
        root.addView(text("Optional. Choose the readings My Timber may copy into your account for progress and personal summaries across the app and website. Read-only; no clinical verification, treatment changes, advertising or external AI sharing. The first import covers up to 30 days."))
        for(metric in listOf("weight","height","steps","sleep")) {
            val box=CheckBox(this).apply {text=metric.replaceFirstChar{it.uppercase()};setTextColor(cream);minHeight=48}
            choices[metric]=box;root.addView(box)
        }
        agreement=CheckBox(this).apply {text="I agree to SHIFT storing and using these selected health readings in My Timber.";setTextColor(cream);minHeight=48}
        root.addView(agreement)
        root.addView(text("Stop syncing, stop using readings, or delete imported copies in My Timber Settings. Phone permissions control access; removing them does not delete copies already imported. Manual entries stay unchanged. Height remains a suggestion to confirm."))
        status=text("Checking your signed-in account. No health readings have been accessed.");status.accessibilityLiveRegion=1;root.addView(status)
        action=Button(this).apply {text="Agree and connect";isEnabled=false;minHeight=48;setOnClickListener{connect()}};root.addView(action)
        root.addView(Button(this).apply {text="Return to My Timber";minHeight=48;setOnClickListener{job?.cancel();finish()}})
        job=lifecycleScope.launch {
            try {
                session=cookie();val s=request();account=s.getInt("accountId");check(account>0)
                connection=find(s)
                if(active(connection)) {
                    val scopes=connection!!.getJSONArray("scopes")
                    for(i in 0 until scopes.length())choices[scopes.getString(i)]?.isChecked=true
                    agreement.isChecked=true;action.text="Sync selected readings"
                }
                choices.values.forEach{it.setOnCheckedChangeListener{_,_->agreement.isChecked=false;action.text="Agree and connect"}}
                status.text="Import destination: ${s.optString("accountLabel","your signed-in account")}. No Health Connect readings have been read yet."
                action.isEnabled=HealthConnectClient.getSdkStatus(this@ConnectedHealthActivity)==HealthConnectClient.SDK_AVAILABLE
                if(!action.isEnabled)status.text="Health Connect is unavailable or needs updating on this phone. Manual My Timber entries still work."
            }catch(e:CancellationException){throw e}catch(e:Exception){status.text="This signed-in session could not connect. Return to My Timber and check your sign-in. Nothing has been imported."}
        }
    }
    private fun find(s:JSONObject):JSONObject? {
        val c=s.getJSONArray("connections")
        for(i in 0 until c.length())if(c.getJSONObject(i).getString("provider")=="health_connect")return c.getJSONObject(i)
        return null
    }
    private fun active(c:JSONObject?)=c!=null && c.optBoolean("syncEnabled") && !c.optBoolean("requiresReconnect",true) && c.optString("consentVersion")==VERSION
    private fun json(vararg fields:Pair<String,Any?>)=JSONObject().apply{fields.forEach{put(it.first,it.second?:JSONObject.NULL)}}
    private suspend fun cookie():String=withContext(Dispatchers.Main) {
        val values=(CookieManager.getInstance().getCookie(ORIGIN)?:"").split(';').map{it.trim()}.filter{it.startsWith("sst_session=")}.distinct()
        check(values.size==1 && values[0].length>12){"account_changed"};values.single()
    }
    private suspend fun request(suffix:String="",body:JSONObject?=null):JSONObject {
        currentCoroutineContext().ensureActive();check(session.isNotEmpty() && cookie()==session){"account_changed"}
        val boundCookie=session
        val result=withContext(Dispatchers.IO) {
            val c=URL("$ORIGIN/v1/connected-health$suffix").openConnection() as HttpsURLConnection
            c.instanceFollowRedirects=false;c.useCaches=false;c.connectTimeout=20000;c.readTimeout=20000
            c.requestMethod=if(body==null)"GET"else"POST"
            c.setRequestProperty("Cookie",boundCookie);c.setRequestProperty("Origin",ORIGIN);c.setRequestProperty("Accept","application/json")
            try {
                if(body!=null){c.doOutput=true;c.setRequestProperty("Content-Type","application/json");c.outputStream.use{it.write(body.toString().toByteArray(Charsets.UTF_8))}}
                check(c.responseCode==200){"request_not_confirmed"}
                val bytes=c.inputStream.use{input->
                    val out=java.io.ByteArrayOutputStream();val buffer=ByteArray(8192)
                    while(true){currentCoroutineContext().ensureActive();val n=input.read(buffer);if(n<0)break;check(out.size()+n<=2_000_000);out.write(buffer,0,n)};out.toByteArray()
                }
                JSONObject(String(bytes,Charsets.UTF_8)).also{check(it.optBoolean("ok"))}
            }finally{c.disconnect()}
        }
        currentCoroutineContext().ensureActive();check(session==boundCookie && cookie()==boundCookie){"account_changed"}
        if(result.has("accountId") && account!=0)check(result.getInt("accountId")==account){"account_changed"}
        return result
    }
    private fun connect() {
        val selected=choices.filter{it.value.isChecked}.keys.toSet()
        if(!agreement.isChecked || selected.isEmpty() || account<=0){status.text="Choose at least one reading and agree before connecting.";return}
        action.isEnabled=false;choices.values.forEach{it.isEnabled=false};agreement.isEnabled=false
        job=lifecycleScope.launch {
            try {
                val current=find(request())
                check((current?.optInt("revision")?:0)==(connection?.optInt("revision")?:0)){"connection_changed"}
                val oldScopes=current?.optJSONArray("scopes")?.let{v->(0 until v.length()).map{v.getString(it)}.toSet()}?:emptySet()
                val reuse=active(current) && oldScopes==selected
                val c=if(reuse)current!! else request("/consent",json("expectedAccountId" to account,"provider" to "health_connect","expectedRevision" to (current?.optInt("revision")?:0),"consentVersion" to VERSION,"consent" to true,"scopes" to JSONArray(selected.sorted()))).getJSONObject("connection")
                connection=c;permit=HealthPermit(account,c.getString("connectionId"),c.getInt("revision"),selected,VERSION,true)
                val client=HealthConnectClient.getOrCreate(this@ConnectedHealthActivity)
                val needed=HealthReader.readPermissions(permit!!)
                if(!reuse && !client.permissionController.getGrantedPermissions().containsAll(needed)) {
                    waitingPermission=true;permissionLauncher.launch(needed)
                }else{readyToRead=true;if(resumed)beginRead()}
            }catch(e:CancellationException){throw e}catch(e:Exception){status.text="Connection stopped. Return to My Timber before trying again. No health import has been reported as saved."}
        }
    }
    private fun beginRead() {
        if(!readyToRead || !resumed)return
        readyToRead=false
        val p=permit?:return
        job=lifecycleScope.launch {
            var imported=0
            try {
                status.text="Reading the categories you chose. Phone permissions control which are available."
                val client=HealthConnectClient.getOrCreate(this@ConnectedHealthActivity)
                val read=HealthReader(client).read(p)
                var revision=connection!!.getInt("syncRevision")
                for(chunk in read.observations.chunked(32)) {
                    val c=find(request());check(c!=null && c.getString("connectionId")==p.connectionId && c.getInt("revision")==p.revision && active(c))
                    val permissions=client.permissionController.getGrantedPermissions()
                    val selected=chunk.filter{HealthReader.readPermissions(p.copy(scopes=setOf(it.metric))).single() in permissions}
                    if(selected.isEmpty())continue
                    val records=JSONArray();selected.forEach{r->records.put(json("metric" to r.metric,"externalId" to r.externalId,"value" to r.value,"unit" to r.unit,"startAt" to r.startAt,"endAt" to r.endAt,"sources" to JSONArray(r.sources),"basis" to r.basis,"timeZone" to r.timeZone))}
                    val receipt=request("/import",json("expectedAccountId" to account,"provider" to "health_connect","connectionId" to p.connectionId,"revision" to p.revision,"syncRevision" to revision,"batchId" to UUID.randomUUID().toString(),"records" to records,"deleted" to JSONArray()))
                    revision=receipt.getInt("syncRevision");imported+=selected.size
                }
                val partial=read.outcomes.values.any{it=="read_failed"||it=="not_permitted"}
                status.text=if(imported==0)"No shared readings were imported. Check your selected categories and phone permissions. Existing history is unchanged." else "$imported readings saved to My Timber.${if(partial)" Some categories were unavailable; existing history is unchanged."else""} Return to Settings to see their sources and dates."
            }catch(e:CancellationException){throw e}catch(e:Exception){status.text="Sync stopped. $imported readings were confirmed before stopping. Check My Timber before retrying; a failed reply does not prove the last request was unsaved."}
            finally{permit=null;choices.values.forEach{it.isEnabled=true};agreement.isEnabled=true}
        }
    }
    override fun onResume(){super.onResume();resumed=true;if(readyToRead)beginRead()}
    override fun onStop(){resumed=false;if(!waitingPermission){job?.cancel();permit=null;session="";account=0;action.isEnabled=false;status.text="Sync stopped when the screen left the foreground. Return to My Timber before reconnecting."};super.onStop()}
    override fun onDestroy(){job?.cancel();session="";permit=null;super.onDestroy()}
}

object HealthEntry {
    @JvmStatic fun openIfRequested(activity:Activity,web:WebView,request:WebResourceRequest):Boolean {
        if(request.url.path!="/member/connected-health")return false
        val current=android.net.Uri.parse(web.url?:"")
        if(request.isForMainFrame && request.hasGesture() && request.method=="GET" && request.url.toString()=="$ORIGIN/member/connected-health" && current.scheme=="https" && current.host=="shiftsometimber.co.uk" && current.port==-1)activity.startActivity(Intent(activity,ConnectedHealthActivity::class.java))
        return true
    }
}

// Exported only to display the static permission rationale; never reads account/data.
class HealthRationaleActivity:Activity() {
    override fun onCreate(state:Bundle?){super.onCreate(state);val text=TextView(this);text.setPadding(24,24,24,24);text.textSize=18f;text.text="My Timber health permissions\n\nOnly selected weight, height, steps and sleep are read. With your separate agreement, copies are stored in your account for progress and personal summaries across the app and website. No health-store writes, clinical decisions, advertising or external AI sharing. Stop syncing or delete imported copies in My Timber Settings. Phone permission removal stops access, not deletion of previously imported copies.\n\nFull privacy notice: https://shiftsometimber.co.uk/privacy";setContentView(text)}
}
