"""Offline, versioned NHS directory preparation; never writes a remote database.

Inputs: current DSE epraccur/npraccur and PHS practice CSV; optional NHSPD gridall.
Northern Ireland postcode coordinates are excluded pending commercial licensing.
"""
import argparse, collections, csv, datetime, hashlib, io, json, pathlib, re, sqlite3, unicodedata, zipfile

def normalise(value):
    return re.sub(r'\s+', ' ', ''.join(c for c in unicodedata.normalize('NFKD', value.casefold()) if not unicodedata.combining(c))).strip()

def postcode(value):
    value=re.sub(r'\s+', '', value.upper())
    return value[:-3]+' '+value[-3:] if value else ''

def practices(inputs):
    records={}; excluded=collections.Counter()
    for filename, ni in [('epraccur.csv',False),('npraccur.csv',True)]:
        with (inputs/filename).open(encoding='utf-8-sig',newline='') as f:
            for row in csv.reader(f):
                if len(row)!=27: raise ValueError('Unexpected DSE column count')
                code,name=row[0:2]; pc=postcode(row[9]); status=row[12].upper()
                if code=='Organisation Code': continue
                if ni:
                    if not re.fullmatch(r'Z00\d{3}',code): raise ValueError('Unexpected NI code')
                    nation='Northern Ireland'
                else:
                    if 'RO76' not in row[25].split('|'): excluded['non_gp_cost_centres']+=1;continue
                    if re.fullmatch(r'S\d{5}',code): excluded['scotland_ods_reconciled_to_phs']+=1;continue
                    if pc.startswith(('GY','JE','IM')) or code.startswith(('ALD','GUE','JER')): excluded['crown_dependencies']+=1;continue
                    nation='Wales' if re.fullmatch(r'W\d{5}',code) else 'England'
                if code in records: raise ValueError('Duplicate practice code '+code)
                address=[x.strip() for x in row[4:9] if x.strip()]
                if not name or not address or not pc: raise ValueError('Incomplete practice address '+code)
                records[code]={'code':code,'name':name,'nation':nation,'address':address,'postcode':pc,'status':status,'source':'NHS ODS DSE '+filename,'east':None,'north':None}
    with (inputs/'scotland.csv').open(encoding='utf-8-sig',newline='') as f:
        rows=csv.DictReader(f)
        required={'PracticeCode','GPPracticeName','AddressLine1','AddressLine2','AddressLine3','AddressLine4','Postcode'}
        if not required.issubset(rows.fieldnames or []): raise ValueError('Unexpected PHS schema')
        for row in rows:
            number=row['PracticeCode'];code='S'+number.zfill(5)
            if not re.fullmatch(r'S\d{5}',code) or code in records: raise ValueError('Invalid or duplicate Scottish code')
            address=[row['AddressLine'+str(i)].strip() for i in range(1,5) if row['AddressLine'+str(i)].strip()]
            if not row['GPPracticeName'] or not address or not row['Postcode']: raise ValueError('Incomplete Scottish record')
            records[code]={'code':code,'name':row['GPPracticeName'],'nation':'Scotland','address':address,'postcode':postcode(row['Postcode']),'status':'ACTIVE','source':'Public Health Scotland 2026-07-01 snapshot','east':None,'north':None}
    branchfile=inputs/'ebranchs.csv'
    if branchfile.exists():
        with branchfile.open(encoding='utf-8-sig',newline='') as f:
            for row in csv.reader(f):
                if len(row)!=27: raise ValueError('Unexpected branch schema')
                code,parent=row[0],row[14]
                if row[11] or row[16]: excluded['closed_branches']+=1;continue
                if parent not in records or records[parent]['status']!='ACTIVE': excluded['branches_without_active_gp_parent']+=1;continue
                address=[x.strip() for x in row[4:9] if x.strip()];pc=postcode(row[9])
                if not row[1] or not address or not pc: excluded['incomplete_branches']+=1;continue
                if code in records: raise ValueError('Duplicate branch code')
                records[code]={'code':code,'name':row[1],'nation':records[parent]['nation'],'address':address,'postcode':pc,'status':'ACTIVE','source':'NHS ODS DSE ebranchs.csv','east':None,'north':None,'parentCode':parent,'entryKind':'branch','parentName':records[parent]['name']}
    return records,dict(excluded)

def prepare(inputs, output, schema):
    output.mkdir(parents=True,exist_ok=True)
    records,excluded=practices(inputs)
    sources=[{'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in sorted(inputs.iterdir()) if p.name in ['epraccur.csv','npraccur.csv','scotland.csv','ebranchs.csv','gridall.zip']]
    counts={n:sum(r['nation']==n and r['status']=='ACTIVE' and r.get('entryKind')!='branch' for r in records.values()) for n in ['England','Wales','Scotland','Northern Ireland']}
    if any(v<100 for v in counts.values()): raise ValueError('A nation is missing or implausibly small')
    version=hashlib.sha256(json.dumps(sources,sort_keys=True).encode()).hexdigest()[:24]
    dbpath=output/'gp-directory.sqlite'
    if dbpath.exists(): raise ValueError('Use an empty output directory; preserve previous imports')
    db=sqlite3.connect(dbpath);db.executescript(schema.read_text())
    db.execute('INSERT INTO gp_directory_versions VALUES(?,?,?,?,0)',(version,datetime.datetime.now(datetime.timezone.utc).isoformat(),json.dumps(counts),json.dumps(sources)))
    postcode_count=0
    if (inputs/'gridall.zip').exists():
        with zipfile.ZipFile(inputs/'gridall.zip') as z:
            header=next(csv.reader(io.TextIOWrapper(z.open('gridlink_header.csv'),encoding='utf-8-sig')))
            with z.open('gridall.csv') as f:
                reader=csv.DictReader(io.TextIOWrapper(f,encoding='utf-8-sig'),fieldnames=header)
                batch=[]
                for row in reader:
                    # Never retain, transform or publish restricted BT/NI coordinate rows.
                    if row['CTRY'] not in ('E92000001','W92000004','S92000003') or row['PCDS'].strip().startswith('BT') or row['DOTERM'].strip(): continue
                    try: east,north=int(row['OSEAST1M']),int(row['OSNRTH1M'])
                    except (ValueError,TypeError): continue
                    if not (0<east<800000 and 0<north<1400000): continue
                    pc=postcode(row['PCDS']);batch.append((version,pc,east,north));postcode_count+=1
                    if len(batch)>=5000:db.executemany('INSERT INTO gp_directory_postcodes VALUES(?,?,?,?)',batch);batch=[]
                db.executemany('INSERT INTO gp_directory_postcodes VALUES(?,?,?,?)',batch)
    for record in records.values():
        geo=db.execute('SELECT east,north FROM gp_directory_postcodes WHERE version=? AND postcode=?',(version,record['postcode'])).fetchone()
        if geo and record['nation']!='Northern Ireland':record['east'],record['north']=geo
        search=normalise(' '.join([record['name'],record.get('parentName',''),*record['address'],record['postcode'],record['code']]))
        db.execute('INSERT INTO gp_directory_practices VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',(version,record['code'],record['nation'],record['name'],search,json.dumps(record['address'],ensure_ascii=False),record['postcode'],record['status'],record['source'],record['east'],record['north'],record.get('parentCode'),record.get('entryKind','practice')))
    db.execute('UPDATE gp_directory_versions SET complete=1 WHERE version=?',(version,))
    db.execute('INSERT INTO gp_directory_active VALUES(1,?)',(version,));db.commit()
    ni_geo=db.execute("SELECT COUNT(*) FROM gp_directory_postcodes WHERE postcode LIKE 'BT%'").fetchone()[0]
    assert ni_geo==0
    report={'version':version,'activePractices':counts,'activeBranchSites':sum(r.get('entryKind')=='branch' for r in records.values()),'totalDirectoryRecords':len(records),'postcodeCoordinates':postcode_count,'excluded':excluded,'sources':sources,'niDistanceRanking':'not enabled: commercial geolocation licence unresolved','sourceLimitations':['Scottish snapshot dated 1 July 2026; not a claim of live completeness','DSE prescribing cost centres filtered to RO76 GP practices','Branches included only with an active GP parent in the source','Registration, clinical delivery addresses and secure recipient channels not verified by selection'],'gbDistances':'Approximate straight-line distances between postcode points; not travel distance','niCoordinateRowsRetained':ni_geo}
    (output/'manifest.json').write_text(json.dumps(report,indent=2))
    with (output/'directory.sql').open('w') as f:
        for line in db.iterdump():f.write(line+'\n')
    (output/'practices.json').write_text(json.dumps(list(records.values()),ensure_ascii=False,separators=(',',':')))
    db.close();print(json.dumps(report,indent=2))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--inputs',required=True,type=pathlib.Path);p.add_argument('--output',required=True,type=pathlib.Path);a=p.parse_args()
    prepare(a.inputs,a.output,pathlib.Path(__file__).with_name('schema.sql'))
