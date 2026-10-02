package uk.co.shiftsometimber.mytimber

import android.os.Bundle
import android.content.Intent
import android.webkit.CookieManager
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContract
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.*
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import kotlinx.coroutines.*
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.time.ZonedDateTime

class HealthConnectActivity: ComponentActivity() {
    private lateinit var client: HealthConnectClient
    private val scope=CoroutineScope(SupervisorJob()+Dispatchers.Main)
    private var sessionCookie=""
    private val permissions=setOf(
        HealthPermission.getReadPermission(WeightRecord::class),
        HealthPermission.getReadPermission(BodyFatRecord::class),
        HealthPermission.getReadPermission(BloodPressureRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(RestingHeartRateRecord::class),
        HealthPermission.getReadPermission(OxygenSaturationRecord::class),
        HealthPermission.getReadPermission(RespiratoryRateRecord::class),
        HealthPermission.getReadPermission(BodyTemperatureRecord::class),
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(DistanceRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(ExerciseSessionRecord::class)
    )
    private val requestPermissions=registerForActivityResult(PermissionController.createRequestPermissionResultContract()){ granted ->
        scope.launch { if(granted.isNotEmpty()) syncGranted() else complete("No health permissions were selected. Nothing was imported. My Timber still works without it.") }
    }
    override fun onCreate(state:Bundle?){
        super.onCreate(state)
        if(!BuildConfig.DEBUG||!NavigationPolicy.healthTestingEnabled){complete("Health testing needs an isolated development address. No health data was read or sent.");return}
        if(HealthConnectClient.getSdkStatus(this)!=HealthConnectClient.SDK_AVAILABLE){complete("Health Connect is unavailable on this device. Install or update it, then try again.");return}
        sessionCookie=CookieManager.getInstance().getCookie(NavigationPolicy.ORIGIN)?:""
        if(sessionCookie.isBlank()){complete("Sign in to the isolated test account before connecting Health Connect.");return}
        client=HealthConnectClient.getOrCreate(this)
        scope.launch{
            try{
                withContext(Dispatchers.IO){
                    val marker=getJson("/v1/device-health/test-environment",false)
                    check(marker.optString("environment")=="isolated-health-test"){"The isolated health-test service could not be verified. No health data was read or sent."}
                    val status=getJson("/v1/device-health/status",true)
                    check(status.optBoolean("trackingEnabled")){"Optional health tracking is off. Turn it on before connecting Health Connect."}
                }
                val granted=client.permissionController.getGrantedPermissions()
                if(granted.containsAll(permissions))syncGranted() else requestPermissions.launch(permissions)
            }catch(error:CancellationException){throw error}
            catch(error:Exception){complete(if(error is IllegalStateException)error.message?:"Health testing could not start." else "The health-test service could not be reached. No health data was read or sent. Please retry when connected.")}
        }
    }
    override fun onDestroy(){scope.cancel();super.onDestroy()}

    data class Reading(val type:String,val value:Double,val observedAt:Instant,val sourceRecordId:String){
        fun json()=JSONObject().put("type",type).put("value",value).put("observedAt",observedAt.toString()).put("sourceRecordId",sourceRecordId)
    }
    private suspend inline fun <reified T:Record> latest(crossinline map:(T)->List<Reading>):List<Reading>{
        val response=client.readRecords(ReadRecordsRequest(T::class,TimeRangeFilter.after(Instant.now().minus(Duration.ofDays(30))),pageSize=1,ascendingOrder=false))
        return response.records.firstOrNull()?.let(map)?:emptyList()
    }
    private inline fun <reified T:Record> has(granted:Set<String>)=granted.contains(HealthPermission.getReadPermission(T::class))
    private suspend fun collect(granted:Set<String>):List<Reading>{
        val out=mutableListOf<Reading>()
        if(has<WeightRecord>(granted))out+=latest<WeightRecord>{listOf(Reading("weight_kg",it.weight.inKilograms,it.time,it.metadata.id))}
        if(has<BodyFatRecord>(granted))out+=latest<BodyFatRecord>{listOf(Reading("body_fat_pct",it.percentage.value,it.time,it.metadata.id))}
        if(has<BloodPressureRecord>(granted))out+=latest<BloodPressureRecord>{listOf(
            Reading("systolic_mmhg",it.systolic.inMillimetersOfMercury,it.time,it.metadata.id+"-sys"),
            Reading("diastolic_mmhg",it.diastolic.inMillimetersOfMercury,it.time,it.metadata.id+"-dia"))}
        if(has<HeartRateRecord>(granted))out+=latest<HeartRateRecord>{r->r.samples.lastOrNull()?.let{listOf(Reading("heart_rate_bpm",it.beatsPerMinute.toDouble(),it.time,r.metadata.id+"-"+it.time.toEpochMilli()))}?:emptyList()}
        if(has<RestingHeartRateRecord>(granted))out+=latest<RestingHeartRateRecord>{listOf(Reading("resting_heart_rate_bpm",it.beatsPerMinute.toDouble(),it.time,it.metadata.id))}
        if(has<OxygenSaturationRecord>(granted))out+=latest<OxygenSaturationRecord>{listOf(Reading("oxygen_saturation_pct",it.percentage.value,it.time,it.metadata.id))}
        if(has<RespiratoryRateRecord>(granted))out+=latest<RespiratoryRateRecord>{listOf(Reading("respiratory_rate_bpm",it.rate,it.time,it.metadata.id))}
        if(has<BodyTemperatureRecord>(granted))out+=latest<BodyTemperatureRecord>{listOf(Reading("body_temperature_c",it.temperature.inCelsius,it.time,it.metadata.id))}
        val now=Instant.now()
        val start=ZonedDateTime.now(ZoneId.systemDefault()).toLocalDate().atStartOfDay(ZoneId.systemDefault()).toInstant()
        val day=start.toString().take(10)
        if(has<StepsRecord>(granted))client.aggregate(AggregateRequest(setOf(StepsRecord.COUNT_TOTAL),TimeRangeFilter.between(start,now)))[StepsRecord.COUNT_TOTAL]?.let{out+=Reading("steps",it.toDouble(),now,"steps-$day")}
        if(has<ActiveCaloriesBurnedRecord>(granted))client.aggregate(AggregateRequest(setOf(ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL),TimeRangeFilter.between(start,now)))[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.let{out+=Reading("active_energy_kcal",it.inKilocalories,now,"energy-$day")}
        if(has<DistanceRecord>(granted))client.aggregate(AggregateRequest(setOf(DistanceRecord.DISTANCE_TOTAL),TimeRangeFilter.between(start,now)))[DistanceRecord.DISTANCE_TOTAL]?.let{out+=Reading("distance_m",it.inMeters,now,"distance-$day")}
        if(has<ExerciseSessionRecord>(granted))client.aggregate(AggregateRequest(setOf(ExerciseSessionRecord.EXERCISE_DURATION_TOTAL),TimeRangeFilter.between(start,now)))[ExerciseSessionRecord.EXERCISE_DURATION_TOTAL]?.let{out+=Reading("exercise_minutes",it.toMinutes().toDouble(),now,"exercise-$day")}
        if(has<SleepSessionRecord>(granted)){val sleep=client.readRecords(ReadRecordsRequest(SleepSessionRecord::class,TimeRangeFilter.after(now.minus(Duration.ofDays(2))),pageSize=20,ascendingOrder=false)).records.firstOrNull()
        sleep?.let{
            val asleep=setOf(SleepSessionRecord.STAGE_TYPE_SLEEPING,SleepSessionRecord.STAGE_TYPE_LIGHT,SleepSessionRecord.STAGE_TYPE_DEEP,SleepSessionRecord.STAGE_TYPE_REM)
            val intervals=it.stages.filter{s->s.stage in asleep}.map{s->doubleArrayOf(s.startTime.epochSecond.toDouble(),s.endTime.epochSecond.toDouble())}.toTypedArray()
            val minutes=HealthSleepMath.latestEpisodeMinutes(intervals)
            if(minutes.isFinite())out+=Reading("sleep_minutes",minutes,it.endTime,it.metadata.id)
        }}
        return out
    }
    private suspend fun syncGranted(){
        try{
            val granted=client.permissionController.getGrantedPermissions()
            val readings=withContext(Dispatchers.IO){collect(granted)}
            if(readings.isEmpty()){complete("No recent readings were shared. Check your selected permissions and available data in Health Connect. My Timber still works without it.");return}
            if(CookieManager.getInstance().getCookie(NavigationPolicy.ORIGIN)!=sessionCookie){complete("The signed-in account changed. Nothing was uploaded. Connect again from the account you want to use.");return}
            withContext(Dispatchers.IO){upload(readings)}
            complete("Health Connect readings saved to the isolated My Timber test account.",true)
        }catch(error:CancellationException){throw error}
        catch(_:Exception){complete("My Timber could not confirm the Health Connect sync. No successful save is confirmed. Please retry.")}
    }
    private fun complete(message:String,success:Boolean=false){
        setResult(if(success)RESULT_OK else RESULT_CANCELED,Intent().putExtra("healthSyncMessage",message));finish()
    }
    private fun getJson(path:String,authenticated:Boolean):JSONObject{
        val connection=(URL(NavigationPolicy.ORIGIN+path).openConnection() as HttpURLConnection)
        connection.instanceFollowRedirects=false;connection.connectTimeout=15000;connection.readTimeout=15000
        if(authenticated)connection.setRequestProperty("Cookie",sessionCookie)
        return try{
            if(connection.responseCode!=200)throw IllegalStateException("The isolated test service or sign-in could not be verified. No health data was read or sent.")
            connection.inputStream.bufferedReader(Charsets.UTF_8).use{JSONObject(it.readText())}
        }finally{connection.disconnect()}
    }
    private fun upload(readings:List<Reading>){
        val body=JSONObject().put("platform","health_connect").put("readings",JSONArray().also{a->readings.forEach{a.put(it.json())}}).toString()
        val connection=(URL(NavigationPolicy.ORIGIN+"/v1/device-health/readings").openConnection() as HttpURLConnection)
        connection.instanceFollowRedirects=false
        connection.requestMethod="POST";connection.connectTimeout=15000;connection.readTimeout=15000;connection.doOutput=true
        connection.setRequestProperty("Content-Type","application/json");connection.setRequestProperty("Origin",NavigationPolicy.ORIGIN)
        connection.setRequestProperty("Cookie",sessionCookie)
        try{
            connection.outputStream.use{it.write(body.toByteArray(Charsets.UTF_8))}
            check(connection.responseCode in 200..299)
            val saved=connection.inputStream.bufferedReader(Charsets.UTF_8).use{JSONObject(it.readText())}
            check(saved.optBoolean("ok")&&saved.optInt("received")==readings.size)
        }finally{connection.disconnect()}
    }
}
