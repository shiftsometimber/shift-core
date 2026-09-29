package uk.co.shiftsometimber.mytimber

import android.os.Bundle
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
        scope.launch { if(granted.isNotEmpty()) syncGranted() else finish() }
    }
    override fun onCreate(state:Bundle?){
        super.onCreate(state)
        if(HealthConnectClient.getSdkStatus(this)!=HealthConnectClient.SDK_AVAILABLE){finish();return}
        client=HealthConnectClient.getOrCreate(this)
        scope.launch{
            val granted=client.permissionController.getGrantedPermissions()
            if(granted.containsAll(permissions))syncGranted() else requestPermissions.launch(permissions)
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
    private suspend fun collect():List<Reading>{
        val out=mutableListOf<Reading>()
        out+=latest<WeightRecord>{listOf(Reading("weight_kg",it.weight.inKilograms,it.time,it.metadata.id))}
        out+=latest<BodyFatRecord>{listOf(Reading("body_fat_pct",it.percentage.value,it.time,it.metadata.id))}
        out+=latest<BloodPressureRecord>{listOf(
            Reading("systolic_mmhg",it.systolic.inMillimetersOfMercury,it.time,it.metadata.id+"-sys"),
            Reading("diastolic_mmhg",it.diastolic.inMillimetersOfMercury,it.time,it.metadata.id+"-dia"))}
        out+=latest<HeartRateRecord>{r->r.samples.lastOrNull()?.let{listOf(Reading("heart_rate_bpm",it.beatsPerMinute.toDouble(),it.time,r.metadata.id+"-"+it.time.toEpochMilli()))}?:emptyList()}
        out+=latest<RestingHeartRateRecord>{listOf(Reading("resting_heart_rate_bpm",it.beatsPerMinute.toDouble(),it.time,it.metadata.id))}
        out+=latest<OxygenSaturationRecord>{listOf(Reading("oxygen_saturation_pct",it.percentage.value,it.time,it.metadata.id))}
        out+=latest<RespiratoryRateRecord>{listOf(Reading("respiratory_rate_bpm",it.rate,it.time,it.metadata.id))}
        out+=latest<BodyTemperatureRecord>{listOf(Reading("body_temperature_c",it.temperature.inCelsius,it.time,it.metadata.id))}
        val now=Instant.now(),start=ZonedDateTime.now(ZoneId.systemDefault()).toLocalDate().atStartOfDay(ZoneId.systemDefault()).toInstant(),day=start.toString().take(10)
        val agg=client.aggregate(AggregateRequest(setOf(StepsRecord.COUNT_TOTAL,ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL,DistanceRecord.DISTANCE_TOTAL,ExerciseSessionRecord.EXERCISE_DURATION_TOTAL),TimeRangeFilter.between(start,now)))
        agg[StepsRecord.COUNT_TOTAL]?.let{out+=Reading("steps",it.toDouble(),now,"steps-$day")}
        agg[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.let{out+=Reading("active_energy_kcal",it.inKilocalories,now,"energy-$day")}
        agg[DistanceRecord.DISTANCE_TOTAL]?.let{out+=Reading("distance_m",it.inMeters,now,"distance-$day")}
        agg[ExerciseSessionRecord.EXERCISE_DURATION_TOTAL]?.let{out+=Reading("exercise_minutes",it.toMinutes().toDouble(),now,"exercise-$day")}
        val sleep=client.readRecords(ReadRecordsRequest(SleepSessionRecord::class,TimeRangeFilter.after(now.minus(Duration.ofDays(2))),pageSize=20,ascendingOrder=false)).records.firstOrNull()
        sleep?.let{out+=Reading("sleep_minutes",Duration.between(it.startTime,it.endTime).toMinutes().toDouble(),it.endTime,it.metadata.id)}
        return out
    }
    private suspend fun syncGranted(){
        try{
            val readings=withContext(Dispatchers.IO){collect()}
            if(readings.isNotEmpty())withContext(Dispatchers.IO){upload(readings)}
        }catch(_:Throwable){}finally{finish()}
    }
    private fun upload(readings:List<Reading>){
        val body=JSONObject().put("platform","health_connect").put("readings",JSONArray().also{a->readings.forEach{a.put(it.json())}}).toString()
        val connection=(URL("https://shiftsometimber.co.uk/v1/device-health/readings").openConnection() as HttpURLConnection)
        connection.requestMethod="POST";connection.connectTimeout=15000;connection.readTimeout=15000;connection.doOutput=true
        connection.setRequestProperty("Content-Type","application/json");connection.setRequestProperty("Origin","https://shiftsometimber.co.uk")
        CookieManager.getInstance().getCookie("https://shiftsometimber.co.uk")?.let{connection.setRequestProperty("Cookie",it)}
        connection.outputStream.use{it.write(body.toByteArray(Charsets.UTF_8))}
        val code=connection.responseCode;if(code !in 200..299)throw IllegalStateException("sync HTTP $code")
        connection.inputStream?.close();connection.disconnect()
    }
}
