"""Prepare reviewed GP completion and atomic pointer CAS. Offline; no remote calls."""
import json
from stage import literal, NATIONS, LIMIT

def activation_sql(plan, proof, expected_active):
    # Caller must supply an independently saved real D1 content readback.
    if proof.get('kind') != 'independent-d1-content-readback' or proof.get('verified') is not True:
        raise ValueError('Actual independent D1 readback required')
    fields=('version','tableRows','tableOrderedContentSHA256','sourceDatabaseSHA256','schemaSHA256')
    if any(proof.get(k)!=plan.get(k) for k in fields):
        raise ValueError('Readback differs from frozen staging packet')
    if proof.get('versionWritesFrozen') is not True or not proof.get('checkedAt'):
        raise ValueError('Freeze staged-version writes after independent verification')
    if expected_active is not None and (not isinstance(expected_active,str) or not expected_active):
        raise ValueError('Explicit prior active version or None required')
    counts=plan['activePractices']
    if set(counts)!=set(NATIONS) or any(not isinstance(v,int) or v<=0 for v in counts.values()):
        raise ValueError('Four nations required')
    v=literal(plan['version'])
    meta=plan['sourceMetadata']
    checks=[
        "(SELECT COUNT(*) FROM gp_directory_practices WHERE version="+v+")="+str(plan['tableRows']['gp_directory_practices']),
        "(SELECT COUNT(*) FROM gp_directory_postcodes WHERE version="+v+")="+str(plan['tableRows']['gp_directory_postcodes']),
        "NOT EXISTS(SELECT 1 FROM gp_directory_postcodes WHERE version="+v+" AND postcode LIKE 'BT%')",
        "NOT EXISTS(SELECT 1 FROM gp_directory_practices WHERE version="+v+" AND nation='Northern Ireland' AND (east IS NOT NULL OR north IS NOT NULL))",
        "counts_json="+literal(meta['counts_json']), "sources_json="+literal(meta['sources_json']),
        "imported_at="+literal(meta['imported_at'])
    ]
    checks += ["(SELECT COUNT(*) FROM gp_directory_practices WHERE version="+v+" AND nation="+literal(n)+" AND status='ACTIVE' AND entry_kind='practice')="+str(counts[n]) for n in NATIONS]
    valid=' AND '.join(checks)
    complete="UPDATE gp_directory_versions SET complete=1 WHERE version="+v+" AND "+valid+";"
    # A failed CAS leaves the previous active pointer intact even if complete=1.
    prior=("NOT EXISTS(SELECT 1 FROM gp_directory_active WHERE singleton=1)" if expected_active is None
           else "EXISTS(SELECT 1 FROM gp_directory_active WHERE singleton=1 AND version="+literal(expected_active)+")")
    select="SELECT 1,version FROM gp_directory_versions WHERE version="+v+" AND complete=1 AND "+valid+" AND "+prior
    cas="INSERT INTO gp_directory_active(singleton,version) "+select+" ON CONFLICT(singleton) DO UPDATE SET version=excluded.version WHERE "+prior+";"
    for sql in (complete,cas):
        if len(sql.encode())>LIMIT:raise ValueError('Activation statement exceeds prepared SQL bound')
    return {'completionSQL':complete,'atomicPointerCAS':cas,'expectedActive':expected_active,
            'requiredReadbackAfterEach':True,'sourceVersion':plan['version'],
            'usageNote':'Counts/verification reads are chargeable usage; scoped cap required.',
            'activationPerformed':False,'remoteCalls':0,
            'ordering':'Apply completion after independent content proof; verify one complete row. CAS once with explicit prior pointer, then read back pointer. No automatic retry on drift.',
            'immutability':'Keep exclusive staged-version ownership and writes frozen through pointer readback. Do not apply under concurrent staged-version writers.'}
