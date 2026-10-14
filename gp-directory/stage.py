"""Prepare bounded, resumable D1 SQL; offline only. Never calls a remote API.
The old SQLite restoration dump is deliberately not used.
A remote import/activation still needs its scoped approval, head and cost receipt.
"""
import argparse, datetime, hashlib, json, math, pathlib, sqlite3

TABLES = ('gp_directory_practices', 'gp_directory_postcodes')
LIMIT = 90000
NATIONS = ('England', 'Wales', 'Scotland', 'Northern Ireland')

def literal(v):
    if v is None: return 'NULL'
    if isinstance(v, str):
        if '\x00' in v: raise ValueError('NUL is not permitted')
        return "'" + v.replace("'", "''") + "'"
    if isinstance(v, int): return str(v)
    if isinstance(v, float) and math.isfinite(v): return repr(v)
    raise ValueError('Unsupported value')

def chunks(table, columns, rows, limit=LIMIT, row_limit=500):
    if table not in TABLES: raise ValueError('Unknown table')
    prefix = 'INSERT INTO ' + table + '(' + ','.join(columns) + ') VALUES\n'
    suffix = '\nON CONFLICT DO NOTHING;\n'
    parts=[]; size=len((prefix+suffix).encode())
    for row in rows:
        part='('+','.join(literal(v) for v in row)+')'
        extra=len(part.encode())+(2 if parts else 0)
        if len((prefix+part+suffix).encode())>limit: raise ValueError('Single row exceeds bound')
        if parts and (size+extra>limit or len(parts)>=row_limit):
            yield prefix+',\n'.join(parts)+suffix, len(parts)
            parts=[]; size=len((prefix+suffix).encode()); extra=len(part.encode())
        parts.append(part); size+=extra
    if parts: yield prefix+',\n'.join(parts)+suffix, len(parts)

def prepare(source, output, schema):
    source=pathlib.Path(source).resolve(); output=pathlib.Path(output)
    if output.exists(): raise ValueError('Use a new output directory; never replace a previous packet')
    db=sqlite3.connect('file:'+str(source)+'?mode=ro',uri=True)
    db.row_factory=sqlite3.Row
    versions=db.execute('SELECT * FROM gp_directory_versions').fetchall()
    if len(versions)!=1: raise ValueError('Exactly one frozen source version required')
    version=versions[0]['version']
    if len(version)!=24 or any(c not in '0123456789abcdef' for c in version): raise ValueError('Invalid version')
    counts={r[0]:r[1] for r in db.execute("SELECT nation,count(*) FROM gp_directory_practices WHERE version=? AND status='ACTIVE' AND entry_kind='practice' GROUP BY nation",(version,))}
    if set(counts)!=set(NATIONS) or any(v<100 for v in counts.values()): raise ValueError('Incomplete four-nation source')
    if json.loads(versions[0]['counts_json'])!=counts: raise ValueError('Source nation counts differ')
    ni=db.execute("SELECT count(*) FROM gp_directory_postcodes WHERE postcode LIKE 'BT%'").fetchone()[0]
    ni+=db.execute("SELECT count(*) FROM gp_directory_practices WHERE nation='Northern Ireland' AND (east IS NOT NULL OR north IS NOT NULL)").fetchone()[0]
    if ni: raise ValueError('Unlicensed NI coordinates must remain excluded')
    if db.execute('PRAGMA foreign_key_check').fetchone(): raise ValueError('Source foreign keys invalid')
    total_rows={table:db.execute('SELECT count(*) FROM '+table+' WHERE version=?',(version,)).fetchone()[0] for table in TABLES}
    for table in TABLES:
        if db.execute('SELECT count(*) FROM '+table+' WHERE version!=?',(version,)).fetchone()[0]: raise ValueError('Unexpected source version')
    output.mkdir(parents=True)
    schema_text=pathlib.Path(schema).read_text()
    if 'BEGIN TRANSACTION' in schema_text or 'DROP TABLE' in schema_text: raise ValueError('Unsafe restoration schema')
    (output/'000000-schema.sql').write_text(schema_text)
    meta=tuple(versions[0])
    stage='INSERT INTO gp_directory_versions(version,imported_at,counts_json,sources_json,complete) VALUES('+','.join(literal(x) for x in (*meta[:4],0))+') ON CONFLICT DO NOTHING;\n'
    (output/'000001-stage-version.sql').write_text(stage)
    plan={'version':version,'preparedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'sourceDatabaseSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),
          'sourceDatabaseBytes':source.stat().st_size,'schemaSHA256':hashlib.sha256(schema_text.encode()).hexdigest(),
          'sourceMetadata':dict(versions[0]),'activePractices':counts,'tableRows':total_rows,
          'niCoordinates':0,'sqlStatementLimitBytes':LIMIT,'rowLimitPerStatement':500,
          'chunks':[],'tableOrderedContentSHA256':{},'remoteCalls':0,'productionWrites':0,
          'activationPrepared':False,'activationPerformed':False,
          'requiredBeforeRemoteApply':['exact admitted core/HQ source and scoped approval',
              'actual plan/remaining read-write-storage allowance and approved maximum cost',
              'fresh previous active version and complete source/licence/size receipt',
              'per-chunk exact-byte/row readback; stop on drift, never change active on partial import',
              'all expected counts and ordered-content hashes independently verified on D1',
              'single compare-and-swap active pointer after complete verified version',
              'authenticated core AND HQ acceptance and same-serving proof']}
    sequence=2
    for table in TABLES:
        columns=[r[1] for r in db.execute('PRAGMA table_info('+table+')')]
        if any(not c.replace('_','').isalnum() for c in columns): raise ValueError('Unexpected column')
        key='code' if table.endswith('practices') else 'postcode'
        iterator=db.execute('SELECT * FROM '+table+' ORDER BY version,'+key)
        ordered=hashlib.sha256()
        def rows():
            for r in iterator:
                values=list(r)
                ordered.update((json.dumps(values,ensure_ascii=False,separators=(',',':'))+'\n').encode())
                yield values
        for sql,n in chunks(table,columns,rows()):
            name=f'{sequence:06d}-{table}.sql'; sequence+=1
            data=sql.encode(); assert len(data)<=LIMIT
            (output/name).write_bytes(data)
            plan['chunks'].append({'file':name,'table':table,'rows':n,'bytes':len(data),
                'sha256':hashlib.sha256(data).hexdigest()})
        plan['tableOrderedContentSHA256'][table]=ordered.hexdigest()
    for table,n in total_rows.items():
        assert sum(c['rows'] for c in plan['chunks'] if c['table']==table)==n
    plan['sqlBytes']=sum(c['bytes'] for c in plan['chunks'])
    plan['minimumDataRowsWritten']=sum(total_rows.values())+1
    plan['costNote']='Logical-row lower bound only; primary/secondary index and verification usage add writes/reads. Do not assume unused account allowances, zero cost or approve plan changes.'
    (output/'plan.json').write_text(json.dumps(plan,indent=2))
    db.close()
    return {k:v for k,v in plan.items() if k not in ('chunks','sourceMetadata')}

if __name__=='__main__':
    p=argparse.ArgumentParser(); p.add_argument('--source',required=True);p.add_argument('--output',required=True)
    p.add_argument('--schema',default=str(pathlib.Path(__file__).with_name('schema.sql')))
    a=p.parse_args();print(json.dumps(prepare(a.source,a.output,a.schema),indent=2))
