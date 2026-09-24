package uk.co.shiftsometimber.mytimber.health

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.*
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import kotlin.coroutines.cancellation.CancellationException

// Native reader library, not yet wired into the shipping app. No networking,
// writes to Health Connect, background work, telemetry or permission auto-prompts.
data class HealthPermit(val memberId:Int,val connectionId:String,val revision:Int,val scopes:Set<String>,val consentVersion:String,val explicitlyConsented:Boolean) {
    init {
        require(memberId>0 && connectionId.isNotBlank() && revision>0 && explicitlyConsented)
        require(consentVersion=="connected-health/2026-09-24-v1")
        require(scopes.isNotEmpty() && setOf("weight","height","steps","sleep").containsAll(scopes))
    }
}
data class HealthObservation(val metric:String,val externalId:String,val value:Double,val unit:String,val startAt:String,val endAt:String,val sources:List<String>,val basis:String,val timeZone:String?=null)
data class HealthRead(val observations:List<HealthObservation>,val outcomes:Map<String,String>)
class HealthReader(private val client:HealthConnectClient) {
    companion object {
        fun availability(context:Context)=HealthConnectClient.getSdkStatus(context)
        fun readPermissions(permit:HealthPermit):Set<String> = permit.scopes.map {
            when(it) {
                "weight"->HealthPermission.getReadPermission(WeightRecord::class)
                "height"->HealthPermission.getReadPermission(HeightRecord::class)
                "steps"->HealthPermission.getReadPermission(StepsRecord::class)
                else->HealthPermission.getReadPermission(SleepSessionRecord::class)
            }
        }.toSet()
    }
    private fun stamp(value:Instant)=value.truncatedTo(ChronoUnit.MILLIS).toString()
    private suspend inline fun <reified T:Record> samples(from:Instant,to:Instant):List<T> {
        val records=mutableListOf<T>();var token:String?=null
        do {
            val page=client.readRecords(ReadRecordsRequest(T::class,timeRangeFilter=TimeRangeFilter.between(from,to),pageSize=500,pageToken=token))
            records.addAll(page.records);check(records.size<=2000) { "incomplete_read" }
            token=page.pageToken
        }while(token!=null)
        return records
    }
    suspend fun read(permit:HealthPermit,now:Instant=Instant.now(),zone:ZoneId=ZoneId.systemDefault()):HealthRead {
        val granted=client.permissionController.getGrantedPermissions()
        val start=now.atZone(zone).toLocalDate().minusDays(29).atStartOfDay(zone).toInstant()
        val output=mutableListOf<HealthObservation>();val outcomes=mutableMapOf<String,String>()
        for(metric in permit.scopes.sorted()) {
            val permission=readPermissions(permit.copy(scopes=setOf(metric))).single()
            if(permission !in granted) { outcomes[metric]="not_permitted";continue }
            try {
                val rows=mutableListOf<HealthObservation>()
                when(metric) {
                    "weight" -> samples<WeightRecord>(start,now).forEach { r -> rows.add(HealthObservation(metric,r.metadata.id,r.weight.inKilograms,"kg",stamp(r.time),stamp(r.time),listOf(r.metadata.dataOrigin.packageName),"sample")) }
                    "height" -> samples<HeightRecord>(start,now).forEach { r -> rows.add(HealthObservation(metric,r.metadata.id,r.height.inMeters*100,"cm",stamp(r.time),stamp(r.time),listOf(r.metadata.dataOrigin.packageName),"sample")) }
                    else -> {
                        var day=start
                        while(day<now) {
                            val next=day.atZone(zone).toLocalDate().plusDays(1).atStartOfDay(zone).toInstant()
                            val end=if(next<now)next else now
                            val result=client.aggregate(AggregateRequest(metrics=if(metric=="steps")setOf(StepsRecord.COUNT_TOTAL)else setOf(SleepSessionRecord.SLEEP_DURATION_TOTAL),timeRangeFilter=TimeRangeFilter.between(day,end)))
                            val value=if(metric=="steps")result[StepsRecord.COUNT_TOTAL]?.toDouble() else result[SleepSessionRecord.SLEEP_DURATION_TOTAL]?.toMillis()?.div(1000.0)
                            // Never substitute zero when the platform returns no data.
                            if(value!=null) {
                                val origins=result.dataOrigins.map { it.packageName }.distinct().sorted()
                                check(origins.size<=16) { "incomplete_read" }
                                rows.add(HealthObservation(metric,"$metric:${day.atZone(zone).toLocalDate()}:$zone",value,if(metric=="steps")"count"else"seconds",stamp(day),stamp(end),if(origins.isEmpty())listOf("android.health.aggregate")else origins,if(metric=="steps")"platform_aggregate"else"session_duration",zone.id))
                            }
                            day=end
                        }
                    }
                }
                // Recheck permission after the read; revoked categories are never returned.
                if(permission !in client.permissionController.getGrantedPermissions()) { outcomes[metric]="not_permitted";continue }
                output.addAll(rows);outcomes[metric]=if(rows.isEmpty())"no_shared_data"else"data_available"
            }catch(e:CancellationException){throw e}catch(e:Exception){outcomes[metric]="read_failed"}
        }
        return HealthRead(output,outcomes)
    }
}
